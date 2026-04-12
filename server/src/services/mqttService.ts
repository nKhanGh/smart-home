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
import { Server as SocketIOServer } from "socket.io";
import deviceService from "./device.service";

type MqttHandler = (feedKey: string, value: string) => void;

const getName = (type: string) => {
  switch (type) {
    case "temperatureSensor":
      return "Nhiệt độ";
    case "humiditySensor":
      return "Độ ẩm";
    case "lightSensor":
      return "Ánh sáng";
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

  // Observer registry: feedKey -> handler
  private readonly handlers: Map<string, MqttHandler> = new Map();

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

  private emitSensorNormal(device: any): void {
    this.io?.emit("sensor:normal", {
      deviceId: device._id,
      type: device.type,
      alert: getName(device.type) + " bình thường",
      text:
        "Cảm biến ở " +
        (device.roomId ? device.roomId.name : "") +
        " đã trở lại bình thường",
    });
  }

  private publishThresholdAction(
    targetDevice: any,
    action: "on" | "off",
  ): void {
    if (
      !targetDevice?.key ||
      !targetDevice.type?.endsWith("Device")
    ) {
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
          value +
          getUnit(device.type) +
          " vượt ngưỡng " +
          threshold.when +
          " " +
          threshold.value +
          getUnit(device.type);

        this.io?.emit("sensor:alert", {
          type: device.type,
          deviceId: device._id,
          alert,
          text,
        });
      } else {
        const targetDevice = threshold.deviceId;
        this.publishThresholdAction(targetDevice, threshold.action);
      }
    }

    if (!isTriggered && wasTriggered) {
      if (threshold.action === "alert") {
        this.emitSensorNormal(device);
      } else {
        const targetDevice = threshold.deviceId;
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
      return;
    }

    const thresholds = await Threshold.find({
      sensorId: device?._id,
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
