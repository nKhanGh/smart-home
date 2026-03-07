/**
 * controllers/deviceController.ts
 *
 * Với Yolo:Bit (WiFi tích hợp):
 *  - Yolo:Bit publish sensor data thẳng lên Adafruit IO
 *  - Backend subscribe Adafruit -> nhận data -> lưu MongoDB  (mqttService._onDeviceData)
 *  - App gửi lệnh -> Backend publish MQTT -> Adafruit -> Yolo:Bit subscribe -> thực thi
 *  - KHÔNG cần gateway, KHÔNG cần webhook
 *
 * Facade Pattern: sendCommand() che giấu luồng MQTT + log sau 1 endpoint đơn giản.
 */
import { Response } from "express";
import { validationResult } from "express-validator";
import Device from "../models/DeviceSchema";
import Room   from "../models/RoomSchema";
import ActionLog from "../models/ActionLogSchema";
import { adafruitAPI } from "../adafruit";
import mqttService from "../services/mqttService";
import { AuthRequest } from "../types";

// ─── GET /api/devices ─────────────────────────────────────────────
export const getDevices = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const devices = await Device.find({}, { data: 0 }).populate("room", "name key");
    res.status(200).json(devices);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── GET /api/devices/:id ─────────────────────────────────────────
export const getDeviceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id }, { data: 0 })
      .populate("room", "name key");
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }
    res.status(200).json(device);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── GET /api/devices/:id/data ────────────────────────────────────
export const getDeviceData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id }, { data: 1 });
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }
    res.status(200).json(device.data);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── POST /api/devices ────────────────────────────────────────────
export const addDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." }); return;
  }
  const { device_id, name, description, room_name } = req.body;
  try {
    const room = await Room.findOne({ name: room_name });
    if (!room) { res.status(404).json({ code: "404", msg: "Room not found." }); return; }

    // Tạo feed trên Adafruit IO (thuộc group của phòng)
    const { data: feed } = await adafruitAPI.post(
      `/feeds?group_key=${room.key}`,
      { feed: { name, description } }
    );

    const device = await Device.create({
      device_id,
      name,
      description,
      key : feed.key,
      room: room._id,
    });

    room.devices.push(device._id as any);
    await room.save();

    // Subscribe feed mới — Yolo:Bit sẽ publish data lên đây
    mqttService.subscribeFeed(feed.key);

    res.status(201).json({ code: "201", msg: "Thêm thiết bị thành công.", device });
  } catch (err: any) {
    res.status(500).json({ code: "500", msg: err.message });
  }
};

// ─── PUT /api/devices/:id ─────────────────────────────────────────
export const updateDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id });
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }

    const { name, description } = req.body;
    await adafruitAPI.put(`/feeds/${device.key}`, { feed: { name, description } });

    device.name        = name        ?? device.name;
    device.description = description ?? device.description;
    await device.save();
    res.status(200).json({ code: "200", msg: "Cập nhật thành công.", device });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── DELETE /api/devices/:id ──────────────────────────────────────
export const deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id });
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }

    await adafruitAPI.delete(`/feeds/${device.key}`);
    await Room.findByIdAndUpdate(device.room, { $pull: { devices: device._id } });
    await Device.findByIdAndDelete(device._id);

    res.status(200).json({ code: "200", msg: "Xóa thiết bị thành công." });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── POST /api/devices/command  (Facade Pattern) ─────────────────
// App bấm -> Backend publish MQTT -> Adafruit -> Yolo:Bit subscribe -> thực thi
export const sendCommand = async (req: AuthRequest, res: Response): Promise<void> => {
  const { device_id, action } = req.body;
  try {
    const device = await Device.findOne({ device_id });
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }

    // Publish lên Adafruit — Yolo:Bit đang subscribe sẽ nhận ngay
    mqttService.publish(device.key, action);

    // Log async — không block response
    ActionLog.create({
      user       : req.user?.id,
      device     : device._id,
      device_name: device.name,
      action,
      actor      : req.user?.username ?? "App",
    }).catch((err) => console.error("[Log] Lưu log thất bại:", err));

    res.status(200).json({ code: "200", msg: "Đã gửi lệnh " + action + " đến " + device.name + "." });
  } catch (err: any) {
    res.status(500).json({ code: "500", msg: err.message });
  }
};

// ─── GET /api/devices/:id/logs ────────────────────────────────────
export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id });
    if (!device) { res.status(404).json({ code: "404", msg: "Device not found." }); return; }

    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const logs = await ActionLog.find({ device: device._id })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(logs);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
