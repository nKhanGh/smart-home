import { Types } from "mongoose";
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
import mqttService from "./mqttService";
import { JwtPayload } from "../types";

export class DeviceServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class DeviceService {
  async getDevices() {
    return Device.find().populate("roomId", "name key");
  }

  async getDeviceById(id: string) {
    const device = await Device.findOne({ _id: id }).populate(
      "roomId",
      "name key",
    );
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }
    return device;
  }

  async getDeviceData(id: string) {
    const device = await Device.findOne({ device_id: id });
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }

    return Data.find({ deviceId: device._id })
      .sort({ recordedAt: -1 })
      .limit(100);
  }

  async addDevice(payload: AddDeviceInput, userId?: string) {
    const { name, description, roomId, type } = payload;

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      throw new DeviceServiceError(404, "Room not found.");
    }

    const { data: feed } = await adafruitAPI.post(`/groups/${room.key}/feeds`, {
      feed: { name, description },
    });

    const device = await Device.create({
      name,
      description,
      key: feed.key,
      roomId: room._id,
      type,
      createdBy: userId,
    });

    await Threshold.create({
      deviceId: device._id,
      value: 0,
      updatedBy: userId,
    });

    room.devices.push(device._id as never);
    await room.save();

    mqttService.subscribeFeed(feed.key);

    return device;
  }

  async updateDevice(id: string, payload: UpdateDeviceInput) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }

    const { name, description, roomId, mode } = payload;
    const newRoom = roomId ? await Room.findById(roomId) : null;
    if (roomId && !newRoom) {
      throw new DeviceServiceError(404, "Room not found.");
    }

    device.name = name ?? device.name;
    device.description = description ?? device.description;
    device.mode = mode ?? device.mode;

    const isRoomChanged = roomId && roomId !== device.roomId.toString();
    if (isRoomChanged) {
      mqttService.unsubscribeFeed(device.key);

      const oldRoom = await Room.findById(device.roomId);
      if (oldRoom) {
        await adafruitAPI.delete(`/feeds/${device.key}`);
        oldRoom.devices = oldRoom.devices.filter(
          (deviceId) => deviceId.toString() !== device._id.toString(),
        );
        await oldRoom.save();
      }

      const { data: feed } = await adafruitAPI.post(
        `/feeds?group_key=${newRoom?.key}`,
        {
          feed: { name, description },
        },
      );

      newRoom?.devices.push(device._id as never);
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
    return device;
  }

  async deleteDevice(id: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }

    await adafruitAPI.delete(`/feeds/${device.key}`);
    await Room.findByIdAndUpdate(device.roomId, {
      $pull: { devices: device._id },
    });
    await Device.findByIdAndDelete(device._id);
  }

  async sendCommand(id: string, payload: SendCommandInput, user?: JwtPayload) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }

    mqttService.publish(
      device.key,
      payload.action === "on" ? "1:app" : "0:app",
    );

    ActionLog.create({
      userId: user?.id,
      deviceId: device._id,
      deviceName: device.name,
      action: payload.action,
      actor: user?.username ?? "App",
    }).catch((err) => console.error("[Log] Luu log that bai:", err));

    return { action: payload.action, deviceName: device.name };
  }

  async getLogs(id: string, startDate?: string, endDate?: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new DeviceServiceError(404, "Device not found.");
    }

    return ActionLog.find({ deviceId: device._id })
      .where("createdAt")
      .gte(new Date(startDate || 0).getTime())
      .lte(new Date(endDate || Date.now()).getTime())
      .sort({ createdAt: -1 });
  }
}

const deviceService = new DeviceService();

export default deviceService;
