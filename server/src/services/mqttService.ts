/**
 * services/mqttService.ts
 *
 * Singleton Pattern  — 1 MQTT client duy nhất cho toàn app
 * Observer Pattern   — subscribe feed -> gọi handler đã đăng ký
 *
 * Với Yolo:Bit: Yolo:Bit publish/subscribe trực tiếp lên Adafruit IO.
 * Backend cũng subscribe Adafruit để nhận sensor data, publish để ra lệnh.
 */
import mqtt, { MqttClient } from "mqtt";
import { SYSTEM_FEEDS, SystemFeedKey } from "../types";
import Device from "../models/DeviceSchema";
import Data from "../models/DataSchema";
import Room from "../models/RoomSchema";
import Threshold from "../models/ThresholdSchema";
import SensorAlert from "../models/SensorAlertSchema";
import User from "../models/UserSchema";
import ActionLog from "../models/ActionLogSchema";
import { sendPushNotification } from "./pushNotificaton.service";
import { Server as SocketIOServer } from "socket.io";
import deviceService from "./device.service";
import { getRedisClient } from "../config/redis";

import MotionWatchSchedule from "../models/MotionWatchScheduleSchema";
type MqttHandler = (feedKey: string, value: string) => void;

interface MotionWatchRuntimeState {
  hitTimestamps: number[];
  lastHitAt: number;
  lastAlertAt: number;
}

const getName = (type: string) => {
  switch (type) {
    case "temperatureSensor":
      return "Nhiệt độ";
    case "humiditySensor":
      return "Độ ẩm";
    case "lightSensor":
      return "Ánh sáng";
    case "motionSensor":
      return "Chuyển động";
    case "threshold":
      return "Ngưỡng cảnh báo";
    default:
      return "Thiết bị";
  }
};

const getUnit = (type: string) => {
  switch (type) {
    case "temperatureSensor":
      return "°C";
    case "humiditySensor":
      return "%";
    case "lightSensor":
      return "lux";
    default:
      return "";
  }
};

class MqttService {
  private static instance: MqttService;
  private client: MqttClient | null = null;
  private readonly prefix: string;
  private io: SocketIOServer | null = null;
  private readonly thresholdAlertStates = new Map<string, boolean>();
  private readonly motionWatchRuntimeFallback = new Map<
    string,
    MotionWatchRuntimeState
  >();

  // Observer registry: feedKey -> handler
  private readonly handlers: Map<string, MqttHandler> = new Map();

  private isMotionWatchDebugEnabled(): boolean {
    return process.env.DEBUG_MOTION_WATCH === "true";
  }

  private constructor() {
    this.prefix = process.env.AIO_USERNAME as string;
  }

  setIO(io: SocketIOServer): void {
    this.io = io;
  }

  // Singleton
  static getInstance(): MqttService {
    if (!MqttService.instance) MqttService.instance = new MqttService();
    return MqttService.instance;
  }

  // ─── Kết nối ─────────────────────────────────────────────────
  connect(): void {
    void getRedisClient();

    this.client = mqtt.connect("mqtts://io.adafruit.com:8883", {
      username: process.env.AIO_USERNAME as string,
      password: process.env.AIO_KEY as string,
      reconnectPeriod: 3000,
    });

    this.client.on("connect", () => {
      console.log("[MQTT] Đã kết nối Adafruit IO.");
      this._subscribeSystemFeeds();
    });

    this.client.on("message", (topic, payload) => {
      const feedKey = topic.replace(`${this.prefix}/feeds/`, "");
      const value = payload.toString();
      const handler = this.handlers.get(feedKey);
      if (handler) handler(feedKey, value);
    });

    this.client.on("error", (err) => console.error("[MQTT] Lỗi:", err.message));
  }

  // ─── Observer: đăng ký handler cho feed ──────────────────────
  registerHandler(feedKey: string, handler: MqttHandler): void {
    this.handlers.set(feedKey, handler);
  }

  // ─── Subscribe feed thiết bị ─────────────────────────────────
  subscribeFeed(feedKey: string): void {
    const topic = `${this.prefix}/feeds/${feedKey}`;
    this.client?.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error(`[MQTT] Subscribe thất bại: ${topic}`);
      else console.log(`[MQTT] Subscribed: ${topic}`);
    });
  }

  unsubscribeFeed(feedKey: string): void {
    const topic = `${this.prefix}/feeds/${feedKey}`;
    this.client?.unsubscribe(topic, (err) => {
      if (err) console.error(`[MQTT] Unsubscribe thất bại: ${topic}`);
      else console.log(`[MQTT] Unsubscribed: ${topic}`);
    });
    this.handlers.delete(feedKey);
  }

  // ─── Publish lệnh đến thiết bị ───────────────────────────────
  publish(feedKey: string, value: string): void {
    const topic = `${this.prefix}/feeds/${feedKey}`;
    if (!this.client?.connected) throw new Error("[MQTT] Client chưa kết nối.");
    this.client.publish(topic, value, { qos: 1 });
  }

  private parseTimeToMinutes(time: string): number {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  }

  private isInScheduleWindow(
    nowMinutes: number,
    startTime: string,
    endTime: string,
  ): boolean {
    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);

    if (startMinutes < endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }

    // Window qua đêm, ví dụ 22:00 -> 05:00
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  private isMotionTriggered(rawValue: string, numericValue: number): boolean {
    if (Number.isFinite(numericValue)) {
      return numericValue > 0;
    }

    const normalized = rawValue.trim().toLowerCase();
    return ["1", "true", "on", "motion", "detected", "yes"].includes(
      normalized,
    );
  }

  private getMotionWatchRedisKey(scheduleId: string): string {
    return `motion-watch:${scheduleId}`;
  }

  private getMotionWatchStateTtlSeconds(schedule: any): number {
    const countWindowSeconds = (schedule.countWindowMinutes ?? 5) * 60;
    const cooldownSeconds = (schedule.cooldownMinutes ?? 10) * 60;
    const minSignalSeconds = schedule.minSignalIntervalSeconds ?? 8;

    return Math.max(
      120,
      countWindowSeconds + cooldownSeconds,
      minSignalSeconds,
    );
  }

  private async getMotionWatchState(
    scheduleId: string,
  ): Promise<MotionWatchRuntimeState> {
    const key = this.getMotionWatchRedisKey(scheduleId);
    const redis = await getRedisClient();

    if (redis) {
      try {
        const serialized = await redis.get(key);
        if (serialized) {
          const parsed = JSON.parse(serialized) as MotionWatchRuntimeState;
          if (
            Array.isArray(parsed.hitTimestamps) &&
            typeof parsed.lastHitAt === "number" &&
            typeof parsed.lastAlertAt === "number"
          ) {
            return parsed;
          }
        }
      } catch (err) {
        console.error("[MQTT] Đọc motion-watch state từ Redis thất bại:", err);
      }
    }

    const current = this.motionWatchRuntimeFallback.get(scheduleId);
    if (current) {
      return current;
    }

    const created: MotionWatchRuntimeState = {
      hitTimestamps: [],
      lastHitAt: 0,
      lastAlertAt: 0,
    };
    this.motionWatchRuntimeFallback.set(scheduleId, created);
    return created;
  }

  private async saveMotionWatchState(
    scheduleId: string,
    schedule: any,
    state: MotionWatchRuntimeState,
  ): Promise<void> {
    const key = this.getMotionWatchRedisKey(scheduleId);
    const redis = await getRedisClient();

    if (redis) {
      try {
        await redis.set(key, JSON.stringify(state), {
          EX: this.getMotionWatchStateTtlSeconds(schedule),
        });
        this.motionWatchRuntimeFallback.delete(scheduleId);
        return;
      } catch (err) {
        console.error("[MQTT] Lưu motion-watch state vào Redis thất bại:", err);
      }
    }

    this.motionWatchRuntimeFallback.set(scheduleId, state);
  }

  private async clearMotionWatchState(scheduleId: string): Promise<void> {
    const key = this.getMotionWatchRedisKey(scheduleId);
    const redis = await getRedisClient();

    if (redis) {
      try {
        await redis.del(key);
      } catch (err) {
        console.error(
          "[MQTT] Xóa motion-watch state trên Redis thất bại:",
          err,
        );
      }
    }

    this.motionWatchRuntimeFallback.delete(scheduleId);
  }

  private async processMotionWatchSchedules(
    device: any,
    rawValue: string,
    numericValue: number,
  ): Promise<void> {
    const now = new Date();
    const nowMs = now.getTime();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      now.getDay()
    ];

    const schedules = await MotionWatchSchedule.find({
      active: true,
      deviceId: device._id,
    });

    if (this.isMotionWatchDebugEnabled()) {
      console.log(
        `[MQTT][MotionWatch] device=${device._id.toString()} schedules=${schedules.length} raw=${rawValue} numeric=${Number.isNaN(numericValue) ? "NaN" : numericValue}`,
      );
    }

    const motionDetected = this.isMotionTriggered(rawValue, numericValue);

    for (const schedule of schedules) {
      if (!schedule.startTime || !schedule.endTime) {
        continue;
      }

      const shouldRunOnDay =
        !schedule.repeatDays?.length ||
        schedule.repeatDays.includes(currentDay);
      const inWindow = this.isInScheduleWindow(
        nowMinutes,
        schedule.startTime,
        schedule.endTime,
      );

      const scheduleId = schedule._id.toString();
      const state = await this.getMotionWatchState(scheduleId);

      if (!shouldRunOnDay || !inWindow) {
        if (this.isMotionWatchDebugEnabled()) {
          console.log(
            `[MQTT][MotionWatch] skip schedule=${scheduleId} shouldRunOnDay=${shouldRunOnDay} inWindow=${inWindow} nowMinutes=${nowMinutes} currentDay=${currentDay} window=${schedule.startTime}-${schedule.endTime} repeatDays=${(schedule.repeatDays ?? []).join(",") || "ALL"}`,
          );
        }
        await this.clearMotionWatchState(scheduleId);
        continue;
      }

      if (!motionDetected) {
        await this.saveMotionWatchState(scheduleId, schedule, state);
        continue;
      }

      const minSignalIntervalMs =
        (schedule.minSignalIntervalSeconds ?? 8) * 1000;
      if (nowMs - state.lastHitAt < minSignalIntervalMs) {
        if (this.isMotionWatchDebugEnabled()) {
          console.log(
            `[MQTT][MotionWatch] skip schedule=${scheduleId} reason=minSignalInterval elapsedMs=${nowMs - state.lastHitAt} requiredMs=${minSignalIntervalMs}`,
          );
        }
        await this.saveMotionWatchState(scheduleId, schedule, state);
        continue;
      }

      state.lastHitAt = nowMs;

      const countWindowMs = (schedule.countWindowMinutes ?? 5) * 60_000;
      state.hitTimestamps = state.hitTimestamps.filter(
        (timestamp) => nowMs - timestamp <= countWindowMs,
      );
      state.hitTimestamps.push(nowMs);

      const triggerCount = schedule.triggerCount ?? 3;
      if (state.hitTimestamps.length < triggerCount) {
        if (this.isMotionWatchDebugEnabled()) {
          console.log(
            `[MQTT][MotionWatch] counting schedule=${scheduleId} count=${state.hitTimestamps.length}/${triggerCount}`,
          );
        }
        await this.saveMotionWatchState(scheduleId, schedule, state);
        continue;
      }

      const cooldownMs = (schedule.cooldownMinutes ?? 10) * 60_000;
      if (nowMs - state.lastAlertAt < cooldownMs) {
        if (this.isMotionWatchDebugEnabled()) {
          console.log(
            `[MQTT][MotionWatch] skip schedule=${scheduleId} reason=cooldown elapsedMs=${nowMs - state.lastAlertAt} requiredMs=${cooldownMs}`,
          );
        }
        await this.saveMotionWatchState(scheduleId, schedule, state);
        continue;
      }

      const room = await Room.findById(device?.roomId);
      const alert = `Cảnh báo chuyển động bất thường - ${room?.name ?? "Không rõ phòng"}`;
      const text =
        `Phát hiện ${state.hitTimestamps.length}/${triggerCount} lần chuyển động ` +
        `trong ${schedule.countWindowMinutes ?? 5} phút (${schedule.startTime}-${schedule.endTime}).`;
      console.log(`[MQTT] ${alert} - ${text}`);
      await SensorAlert.create({
        deviceId: device._id,
        value: String(state.hitTimestamps.length),
        threshold: triggerCount,
        createdAt: Date.now(),
      });

      this.io?.emit("motion:alert", {
        type: device.type,
        deviceId: device._id,
        roomId: device.roomId ? device.roomId._id : null,
        alert,
        text,
        triggerCount,
        detectedCount: state.hitTimestamps.length,
        windowMinutes: schedule.countWindowMinutes ?? 5,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });

      // Giữ tương thích FE đang lắng nghe sensor:alert.
      this.io?.emit("sensor:alert", {
        type: device.type,
        deviceId: device._id,
        alert,
        text,
      });

      // Send push notifications to all users who have push tokens
      try {
        const usersWithTokens = await User.find(
          { pushTokens: { $exists: true, $ne: [] } },
          "pushTokens",
        ).exec();
        const tokens = usersWithTokens.flatMap((u: any) => u.pushTokens || []);
        if (tokens.length > 0) {
          await sendPushNotification({
            tokens,
            title: alert,
            body: text,
            data: { deviceId: device._id.toString() },
          });
        }
      } catch (err) {
        console.error(
          "Failed to send push notifications for motion alert:",
          err,
        );
      }
      state.lastAlertAt = nowMs;
      state.hitTimestamps = [];
      await this.saveMotionWatchState(scheduleId, schedule, state);
    }
  }
  // ─── Publish system config đến Yolo:Bit ──────────────────────
  publishSystem(sysKey: SystemFeedKey, value: string): void {
    const feedKey = SYSTEM_FEEDS[sysKey];
    const topic = `${this.prefix}/feeds/${feedKey}`;
    if (!this.client?.connected) {
      console.warn("[MQTT] Chưa kết nối — bỏ qua system publish.");
      return;
    }
    this.client.publish(topic, value, { qos: 1 });
  }

  // ─── Subscribe các system feeds ──────────────────────────────
  private _subscribeSystemFeeds(): void {
    for (const feedKey of Object.values(SYSTEM_FEEDS)) {
      const topic = `${this.prefix}/feeds/${feedKey}`;
      this.client?.subscribe(topic, { qos: 1 });
    }
  }

  // ─── Load tất cả device feeds từ DB và subscribe ─────────────
  async subscribeAllDeviceFeeds(): Promise<void> {
    const devices = await Device.find({}, "key");
    devices.forEach((d) => {
      this.subscribeFeed(d.key);
      // Observer: khi Yolo:Bit gửi data lên feed -> lưu DB
      this.registerHandler(d.key, this.onDeviceData.bind(this));
    });

    // System feeds: nhận config thay đổi từ Yolo:Bit (nếu có)
    // this.registerHandler(
    //   SYSTEM_FEEDS["sys.config.temp"],
    //   (_key, val) => SystemConfig.findOneAndUpdate(
    //     { config_key: "temp_alert_threshold" }, { config_value: val }).exec()
    // );
  }

  private isTriggeredByThreshold(
    sensorValue: number,
    thresholdValue: number,
    when: "above" | "below",
  ): boolean {
    if (when === "above") {
      return sensorValue >= thresholdValue;
    }

    return sensorValue <= thresholdValue;
  }

  private async emitSensorNormal(device: any): Promise<void> {
    const alert = getName(device.type) + " bình thường";
    const text =
      device.name + " " +
      (device.roomId ? device.roomId.name : "") +
      " đã trở lại bình thường";

    this.io?.emit("sensor:normal", {
      deviceId: device._id,
      type: device.type,
      alert,
      text,
    });

    try {
      const usersWithTokens = await User.find(
        { pushTokens: { $exists: true, $ne: [] } },
        "pushTokens",
      ).exec();
      const tokens = usersWithTokens.flatMap((u: any) => u.pushTokens || []);
      if (tokens.length > 0) {
        await sendPushNotification({
          tokens,
          title: alert,
          body: text,
          data: { deviceId: device._id.toString() },
        });
      }
    } catch (err) {
      console.error("Failed to send push notifications for normal state:", err);
    }
  }

  private publishThresholdAction(
    targetDevice: any,
    action: "on" | "off" | "alert",
  ): void {
    if (!targetDevice?.key || !targetDevice.type?.endsWith("Device")) {
      return;
    }

    if (action === "alert") {
      if (targetDevice.type === "lightDevice") {
        this.publish(targetDevice.key, "4");
      }
      return;
    }

    let payload: string;
    if (targetDevice.type === "fanDevice") {
      payload = action === "on" ? "100" : "0";
    } else {
      payload = action === "on" ? "1" : "0";
    }

    this.publish(targetDevice.key, payload);
  }

  private async processThreshold(
    threshold: any,
    device: any,
    value: string,
    numericValue: number,
    lastValue: number | null,
  ): Promise<void> {
    if (!threshold.active) {
      return;
    }

    if (threshold.action === "alert") {
      const alertKey = threshold?._id?.toString?.() ?? "";
      const wasAlerting = alertKey
        ? this.thresholdAlertStates.get(alertKey) === true
        : false;
      const isTriggered = this.isTriggeredByThreshold(
        numericValue,
        threshold.value,
        threshold.when,
      );

      if (isTriggered && !wasAlerting) {
        await SensorAlert.create({
          deviceId: device?._id,
          value: numericValue,
          threshold: threshold.value,
          createdAt: Date.now(),
        });

        const room = await Room.findById(device?.roomId);
        const alert =
          "Cảnh báo " + getName(device.type) + " bất thường";
        const text =
          device.name + " - " +
          room?.name + ": " +
          value +
          getUnit(device.type) +
          " vượt ngưỡng " +
          (threshold.when === "above" ? "trên" : "dưới") +
          " " +
          threshold.value +
          getUnit(device.type);

        this.io?.emit("sensor:alert", {
          type: device.type,
          deviceId: device._id,
          alert,
          text,
        });

        try {
          const usersWithTokens = await User.find(
            { pushTokens: { $exists: true, $ne: [] } },
            "pushTokens",
          ).exec();
          const tokens = usersWithTokens.flatMap(
            (u: any) => u.pushTokens || [],
          );
          if (tokens.length > 0) {
            await sendPushNotification({
              tokens,
              title: alert,
              body: text,
              data: { deviceId: device._id.toString() },
            });
          }
        } catch (err) {
          console.error(
            "Failed to send push notifications for threshold alert:",
            err,
          );
        }

        this.publishThresholdAction(threshold.deviceId, "alert");
        ActionLog.create({
          deviceId: threshold.deviceId?._id ?? threshold.deviceId,
          action: "alert",
          actor: "System",
        }).catch((err) =>
          console.error("[Log] Failed to log threshold alert:", err),
        );
      }

      if (!isTriggered && wasAlerting) {
        await this.emitSensorNormal(device);
        const targetDevice = threshold.deviceId;
        if (targetDevice?.type === "lightDevice" && targetDevice?.key) {
          this.publish(targetDevice.key, "0");
        }
      }

      if (alertKey) {
        this.thresholdAlertStates.set(alertKey, isTriggered);
      }

      return;
    }

    const wasTriggered =
      lastValue === null
        ? false
        : this.isTriggeredByThreshold(
            lastValue,
            threshold.value,
            threshold.when,
          );

    const isTriggered = this.isTriggeredByThreshold(
      numericValue,
      threshold.value,
      threshold.when,
    );

    const targetDevice = threshold.deviceId;

    if (isTriggered && !wasTriggered) {
      if (threshold.action === "alert") {
        await SensorAlert.create({
          deviceId: device?._id,
          value: numericValue,
          threshold: threshold.value,
          createdAt: Date.now(),
        });

        const room = await Room.findById(device?.roomId);
        const alert =
          "Cảnh báo " + getName(device.type) + " bất thường - " + room?.name;
        const text =
            device.name + " - " +
            (room?.name ? room.name + ": " : "") +
          value +
          getUnit(device.type) +
          " vượt ngưỡng " +
          (threshold.when === "above" ? "trên" : "dưới") +
          " " +
          threshold.value +
          getUnit(device.type);

        this.io?.emit("sensor:alert", {
          type: device.type,
          deviceId: device._id,
          alert,
          text,
        });
        // Send push notifications for threshold alerts
        try {
          const usersWithTokens = await User.find(
            { pushTokens: { $exists: true, $ne: [] } },
            "pushTokens",
          ).exec();
          const tokens = usersWithTokens.flatMap(
            (u: any) => u.pushTokens || [],
          );
          if (tokens.length > 0) {
            await sendPushNotification({
              tokens,
              title: alert,
              body: text,
              data: { deviceId: device._id.toString() },
            });
          }
        } catch (err) {
          console.error(
            "Failed to send push notifications for threshold alert:",
            err,
          );
        }

        this.publishThresholdAction(targetDevice, "alert");
        ActionLog.create({
          deviceId: targetDevice?._id ?? targetDevice,
          action: "alert",
          actor: "System",
        }).catch((err) =>
          console.error("[Log] Failed to log threshold alert:", err),
        );
      } else {
        this.publishThresholdAction(targetDevice, threshold.action);
        ActionLog.create({
          deviceId: targetDevice?._id ?? targetDevice,
          action: threshold.action,
          actor: "System",
        }).catch((err) =>
          console.error("[Log] Failed to log threshold action:", err),
        );
      }
    }

    if (!isTriggered && wasTriggered) {
      if (threshold.action === "alert") {
        await this.emitSensorNormal(device);
        if (targetDevice?.type === "lightDevice" && targetDevice?.key) {
          this.publish(targetDevice.key, "0");
        }
        return;
      }

      if (!targetDevice.type.endsWith("Device")) {
        const revertAction = threshold.action === "on" ? "off" : "on";
        this.publishThresholdAction(targetDevice, revertAction);
      }
    }
  }

  private async processSensorData(device: any, value: string): Promise<void> {
    const lastData = await deviceService.getCurrentData(
      device?._id.toString() || "",
    );
    const numericValue = Number.parseFloat(value);

    await Data.create({
      deviceId: device?._id,
      value,
    });

    this.io?.emit("sensor:data", {
      deviceId: device._id,
      roomId: device.roomId ? device.roomId._id : null,
      type: device.type,
      value: numericValue,
      roomName: device.roomId ? device.roomId.name : "",
    });

    if (Number.isNaN(numericValue)) {
      console.warn(`[MQTT] Giá trị sensor không hợp lệ: ${value}`);

      if (device.type === "motionSensor") {
        await this.processMotionWatchSchedules(device, value, numericValue);
      }

      return;
    }

    const thresholds = await Threshold.find({
      sensorId: device?._id,
      active: true,
    }).populate("deviceId", "name key type mode roomId");

    const lastValue = lastData ? Number.parseFloat(lastData.value) : null;

    for (const threshold of thresholds) {
      await this.processThreshold(
        threshold,
        device,
        value,
        numericValue,
        lastValue,
      );
    }

    if (device.type === "motionSensor") {
      await this.processMotionWatchSchedules(device, value, numericValue);
    }
  }

  // ─── Khi nhận sensor data từ Yolo:Bit ────────────────────────
  async onDeviceData(feedKey: string, value: string): Promise<void> {
    console.log(`[MQTT] Data received: ${feedKey} = ${value}`);
    try {
      const device = await Device.findOne({ key: feedKey }).populate(
        "roomId",
        "name",
      );
      if (device?.type.endsWith("Sensor")) {
        await this.processSensorData(device, value);
      } else if (device?.type.endsWith("Device")) {
        console.log(
          `[MQTT] Received command response from device ${device.name}: ${value}`,
        );
        this.io?.emit("device:action", {
          deviceId: device._id,
          roomId: device.roomId ? (device.roomId as any)._id : null,
          type: device.type,
          value: value,
          roomName: device.roomId ? (device.roomId as any).name : "",
        });
      }
    } catch (err) {
      console.error("[MQTT] Lưu data thất bại:", err);
    }
  }
}

export default MqttService.getInstance();
