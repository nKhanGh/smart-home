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
import Device, {
  AddDeviceInput,
  SendCommandInput,
  UpdateDeviceInput,
} from "../models/DeviceSchema";
import Room from "../models/RoomSchema";
import Data from "../models/DataSchema";
import ActionLog from "../models/ActionLogSchema";
import Threshold from "../models/ThresholdSchema";
import { adafruitAPI } from "../adafruit";
import mqttService from "../services/mqttService";
import { AuthRequest } from "../types";
import { Types } from "mongoose";

// ─── GET /api/devices ─────────────────────────────────────────────
export const getDevices = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const devices = await Device.find().populate(
      "roomId",
      "name key",
    );
    res.status(200).json(devices);
  } catch (err) {
    console.error("Error fetching devices:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── GET /api/devices/:id ─────────────────────────────────────────
export const getDeviceById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne(
      { _id: req.params.id },
    ).populate("roomId", "name key");
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }
    res.status(200).json(device);
  } catch (err) {
    console.log("Error fetching device:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── GET /api/devices/:id/data ────────────────────────────────────
export const getDeviceData = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ device_id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }
    const data = await Data.find({ deviceId: device._id })
      .sort({ recordedAt: -1 })
      .limit(100);
    res.status(200).json(data);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── POST /api/devices ────────────────────────────────────────────
// add createdBy
export const addDevice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." });
    return;
  }
  const { name, description, roomId, type } = req.body as AddDeviceInput;
  try {
    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      res.status(404).json({ code: "404", msg: "Room not found." });
      return;
    }

    // Tạo feed trên Adafruit IO (thuộc group của phòng)
    const { data: feed } = await adafruitAPI.post(
      `/groups/${room.key}/feeds`,
      { feed: { name, description } },
    );
    

    const device = await Device.create({
      name,
      description,
      key: feed.key,
      roomId: room._id,
      type,
      createdBy: req.user?.id,
    });

    await Threshold.create({
      deviceId: device._id,
      value: 0,
      updatedBy: req.user?.id,
    });

    room.devices.push(device._id as any);
    await room.save();

    // Subscribe feed mới — Yolo:Bit sẽ publish data lên đây
    mqttService.subscribeFeed(feed.key);

    console.log(`[Device Created] ${device.name} (ID: ${device._id}) in Room: ${room.name}`);
    res
      .status(201)
      .json({ code: "201", msg: "Thêm thiết bị thành công.", device });
  } catch (err: any) {
    res.status(500).json({ code: "500", msg: err.message });
  }
};

// ─── PUT /api/devices/:id ─────────────────────────────────────────
export const updateDevice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ _id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }

    const { name, description, roomId, mode } = req.body as UpdateDeviceInput;
    const newRoom = roomId ? await Room.findById(roomId) : null;
    if (roomId && !newRoom) {
      res.status(404).json({ code: "404", msg: "Room not found." });
      return;
    }

    device.name = name ?? device.name;
    device.description = description ?? device.description;
    device.mode = mode ?? device.mode;
    const isRoomChanged = roomId && roomId !== device.roomId.toString();
    if (isRoomChanged) {
      // Unsubscribe feed cũ
      mqttService.unsubscribeFeed(device.key);

      // Cập nhật room reference
      const oldRoom = await Room.findById(device.roomId);
      if (oldRoom) {
        await adafruitAPI.delete(`/feeds/${device.key}`);
        oldRoom.devices = oldRoom.devices.filter(
          (id) => id.toString() !== device._id.toString(),
        );
        await oldRoom.save();
      }
      const { data: feed } = await adafruitAPI.post(
        `/feeds?group_key=${newRoom?.key}`,
        { feed: { name, description } },
      );
      newRoom?.devices.push(device._id as any);
      await newRoom?.save();

      device.key = feed.key;
      device.roomId = new Types.ObjectId(roomId);

      mqttService.registerHandler(
        feed.key,
        mqttService.onDeviceData.bind(mqttService),
      );
      mqttService.subscribeFeed(device.key);
    }

    if (!isRoomChanged) {
      await adafruitAPI.put(`/feeds/${device.key}`, {
        feed: { name, description },
      });
    }

    await device.save();
    res.status(200).json({ code: "200", msg: "Cập nhật thành công.", device });
  } catch (err: any) {
    console.error("Error updating device:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── DELETE /api/devices/:id ──────────────────────────────────────
export const deleteDevice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ _id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }

    await adafruitAPI.delete(`/feeds/${device.key}`);
    await Room.findByIdAndUpdate(device.roomId, {
      $pull: { devices: device._id },
    });
    await Device.findByIdAndDelete(device._id);

    res.status(200).json({ code: "200", msg: "Xóa thiết bị thành công." });
  } catch (err) {
    console.error("Error deleting device:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// ─── POST /api/devices/command  (Facade Pattern) ─────────────────
// App bấm -> Backend publish MQTT -> Adafruit -> Yolo:Bit subscribe -> thực thi
export const sendCommand = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { action } = req.body as SendCommandInput;
  try {
    const device = await Device.findOne({ _id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }

    // Publish lên Adafruit — Yolo:Bit đang subscribe sẽ nhận ngay
    mqttService.publish(device.key, action === "on" ? "1:app" : "0:app");

    // Log async — không block response
    ActionLog.create({
      userId: req.user?.id,
      deviceId: device._id,
      deviceName: device.name,
      action,
      actor: req.user?.username ?? "App",
    }).catch((err) => console.error("[Log] Lưu log thất bại:", err));

    res.status(200).json({
      code: "200",
      msg: "Đã gửi lệnh " + action + " đến " + device.name + ".",
    });
  } catch (err: any) {
    res.status(500).json({ code: "500", msg: err.message });
  }
};

// ─── GET /api/devices/:id/logs ────────────────────────────────────
export const getLogs = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ _id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    console.log(`[Get Logs] Device: ${device.name}, Start: ${startDate}, End: ${endDate}`);
    const logs = await ActionLog.find({ deviceId: device._id })
      .where("createdAt").gte(new Date(startDate).getTime())
      .lte(new Date(endDate).getTime())
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
