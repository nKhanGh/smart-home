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
import ActionLog from "../models/ActionLogSchema";
import Threshold from "../models/ThresholdSchema";
import SensorAlert from "../models/SensorAlertSchema";
import { Server as SocketIOServer } from "socket.io";
import { get } from "http";
// import { SystemConfig } from "../models/SystemConfigSchema";

type MqttHandler = (feedKey: string, value: string) => void;

const getName = (type: string) => {
  switch(type){
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
}

const getUnit = (type: string) => {
  switch(type){
    case "temperatureSensor":
      return "°C";
    case "humiditySensor":
      return "%";
    case "lightSensor":
      return "lux";
    default:
      return "";
  }
}

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

  // ─── Khi nhận sensor data từ Yolo:Bit ────────────────────────
  async onDeviceData(feedKey: string, value: string): Promise<void> {
    console.log(`[MQTT] Data received: ${feedKey} = ${value}`);
    try {
      const device = await Device.findOne({ key: feedKey });
      if (device?.type.endsWith("Sensor")) {
        await Data.create({
          deviceId: device?._id,
          value,
        });
        const threshold = await Threshold.findOne({ deviceId: device?._id });
        this.io?.emit("sensor:data", {
          deviceId: device._id,
          roomId: device.roomId,
          type: device.type,
          value: Number.parseFloat(value),
          feedKey,
        });
        console.log(`[MQTT] Data received1: ${feedKey} = ${value}`);
        if (threshold && Number.parseFloat(value) >= threshold.value) {
          await SensorAlert.create({
            deviceId: device?._id,
            value: Number.parseFloat(value),
            threshold: threshold.value,
            createdAt: Date.now(),
          });
          const room = await Room.findById(device?.roomId);
          const alert = "Cảnh báo "  + getName(device.type) + " cao - " + room?.name;
          const text = value + getUnit(device.type) + " vượt ngưỡng cho phép " + threshold.value + getUnit(device.type);
          this.io?.emit("sensor:alert", {
            type: device.type,
            deviceId: device._id,
            alert,
            text,
          });
        } else {
          this.io?.emit("sensor:normal", {
            deviceId: device._id,
          });
        }
      }
      // else if (value.endsWith(":local")) {
      //   await ActionLog.create({
      //     deviceId: device?._id,
      //     deviceName: device?.name ?? "Unknown Device",
      //     action: value === "1:local" ? "on" : "off",
      //     actor: "local",
      //   });
      // }
    } catch (err) {
      console.error("[MQTT] Lưu data thất bại:", err);
    }
  }
}

export default MqttService.getInstance();
