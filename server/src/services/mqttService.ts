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
import { SystemConfig } from "../models/SystemConfigSchema";

type MqttHandler = (feedKey: string, value: string) => void;

class MqttService {
  private static instance: MqttService;
  private client: MqttClient | null = null;
  private readonly prefix: string;

  // Observer registry: feedKey -> handler
  private readonly handlers: Map<string, MqttHandler> = new Map();

  private constructor() {
    this.prefix = process.env.AIO_USERNAME as string;
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
      password: process.env.AIO_KEY      as string,
      reconnectPeriod: 3000,
    });

    this.client.on("connect", () => {
      console.log("[MQTT] Đã kết nối Adafruit IO.");
      this._subscribeSystemFeeds();
    });

    this.client.on("message", (topic, payload) => {
      const feedKey = topic.replace(`${this.prefix}/feeds/`, "");
      const value   = payload.toString();
      const handler = this.handlers.get(feedKey);
      if (handler) handler(feedKey, value);
    });

    this.client.on("error", (err) =>
      console.error("[MQTT] Lỗi:", err.message));
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

  // ─── Publish lệnh đến thiết bị ───────────────────────────────
  publish(feedKey: string, value: string): void {
    const topic = `${this.prefix}/feeds/${feedKey}`;
    if (!this.client?.connected)
      throw new Error("[MQTT] Client chưa kết nối.");
    this.client.publish(topic, value, { qos: 1 });
  }

  // ─── Publish system config đến Yolo:Bit ──────────────────────
  publishSystem(sysKey: SystemFeedKey, value: string): void {
    const feedKey = SYSTEM_FEEDS[sysKey];
    const topic   = `${this.prefix}/feeds/${feedKey}`;
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
      this.registerHandler(d.key, this._onDeviceData.bind(this));
    });

    // System feeds: nhận config thay đổi từ Yolo:Bit (nếu có)
    this.registerHandler(
      SYSTEM_FEEDS["sys.config.temp"],
      (_key, val) => SystemConfig.findOneAndUpdate(
        { config_key: "temp_alert_threshold" }, { config_value: val }).exec()
    );
  }

  // ─── Khi nhận sensor data từ Yolo:Bit ────────────────────────
  private async _onDeviceData(feedKey: string, value: string): Promise<void> {
    try {
      const device = await Device.findOne({ key: feedKey });
      if (!device) return;
      (device as any).pushData(value);
      await device.save();
    } catch (err) {
      console.error("[MQTT] Lưu data thất bại:", err);
    }
  }
}

export default MqttService.getInstance();
