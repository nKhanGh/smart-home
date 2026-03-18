import { Types } from "mongoose";
import Device, {
  AddDeviceInput,
  SendCommandInput,
  UpdateDeviceInput,
  VoiceCommandInput,
} from "../models/DeviceSchema";
import Room from "../models/RoomSchema";
import Data from "../models/DataSchema";
import ActionLog from "../models/ActionLogSchema";
import Threshold from "../models/ThresholdSchema";
import { adafruitAPI } from "../adafruit";
import mqttService from "./mqttService";
import { JwtPayload } from "../types";
import { ServiceError } from "../errors/service.error";

export class DeviceService {
  private readonly genericRoomTokens = new Set(["phong", "phòng", "room"]);

  private sanitizeText(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private getMeaningfulTokens(value: string): string[] {
    return this.sanitizeText(value)
      .split(" ")
      .filter((token) => token.length > 1)
      .filter((token) => !this.genericRoomTokens.has(token));
  }

  private detectAction(text: string): "on" | "off" | null {
    const onKeywords = [
      "bật",
      "bat",
      "mở",
      "mo",
      "khởi động",
      "khoi dong",
      "kích hoạt",
      "kich hoat",
      "turn on",
    ];
    const offKeywords = [
      "tắt",
      "tat",
      "đóng",
      "dong",
      "ngắt",
      "ngat",
      "hủy",
      "huy",
      "turn off",
    ];

    if (onKeywords.some((keyword) => text.includes(keyword))) {
      return "on";
    }

    if (offKeywords.some((keyword) => text.includes(keyword))) {
      return "off";
    }

    return null;
  }

  private scoreDeviceMatch(text: string, deviceName: string): number {
    const sanitizedDeviceName = this.sanitizeText(deviceName);
    if (!sanitizedDeviceName) {
      return 0;
    }

    if (text.includes(sanitizedDeviceName)) {
      return 100 + sanitizedDeviceName.length;
    }

    const tokens = sanitizedDeviceName
      .split(" ")
      .filter((token) => token.length > 1);
    if (tokens.length === 0) {
      return 0;
    }

    const matchedTokenCount = tokens.filter((token) =>
      text.includes(token),
    ).length;
    if (matchedTokenCount === 0) {
      return 0;
    }

    if (matchedTokenCount === tokens.length) {
      return 60 + matchedTokenCount;
    }

    return 10 + matchedTokenCount;
  }

  private scoreRoomMatch(text: string, roomName: string): number {
    const sanitizedRoomName = this.sanitizeText(roomName);
    if (!sanitizedRoomName) {
      return 0;
    }

    if (text.includes(sanitizedRoomName)) {
      return 100 + sanitizedRoomName.length;
    }

    const tokens = this.getMeaningfulTokens(roomName);
    if (tokens.length === 0) {
      return 0;
    }

    const matchedTokenCount = tokens.filter((token) =>
      text.includes(token),
    ).length;
    if (matchedTokenCount === 0) {
      return 0;
    }

    if (matchedTokenCount === tokens.length) {
      return 60 + matchedTokenCount;
    }

    return 10 + matchedTokenCount;
  }

  async getDevices() {
    return Device.find().populate("roomId", "name key");
  }

  async getDeviceById(id: string) {
    const device = await Device.findOne({ _id: id }).populate(
      "roomId",
      "name key",
    );
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    return device;
  }

  async getDeviceData(id: string) {
    const device = await Device.findOne({ _id: id });
    console.log("Fetching data for device:", id, "found device:", !!device);
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    return Data.find({ deviceId: device._id })
      .sort({ recordedAt: -1 })
      .limit(100);
  }

  async addDevice(payload: AddDeviceInput, userId?: string) {
    const { name, description, roomId, type } = payload;

    const room = await Room.findOne({ _id: roomId });
    if (!room) {
      throw new ServiceError(404, "Room not found.");
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
      throw new ServiceError(404, "Device not found.");
    }

    const { name, description, roomId, mode } = payload;
    const newRoom = roomId ? await Room.findById(roomId) : null;
    if (roomId && !newRoom) {
      throw new ServiceError(404, "Room not found.");
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
      throw new ServiceError(404, "Device not found.");
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
      throw new ServiceError(404, "Device not found.");
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

  async executeVoiceCommand(payload: VoiceCommandInput, user?: JwtPayload) {
    const sanitizedText = this.sanitizeText(payload.text);
    if (!sanitizedText) {
      throw new ServiceError(400, "Nội dung lệnh không hợp lệ.");
    }

    const action = this.detectAction(sanitizedText);
    if (!action) {
      throw new ServiceError(
        400,
        "Không xác định được hành động bật/tắt trong câu lệnh.",
      );
    }

    const rooms = await Room.find({}, "name");
    const rankedRooms = rooms
      .map((room) => ({
        room,
        score: this.scoreRoomMatch(sanitizedText, room.name),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    let matchedRoom: (typeof rankedRooms)[number]["room"] | undefined =
      rankedRooms[0]?.room;
    const topRoomScore = rankedRooms[0]?.score ?? 0;

    if (
      topRoomScore > 0 &&
      rankedRooms.length > 1 &&
      rankedRooms[1].score === topRoomScore
    ) {
      throw new ServiceError(
        409,
        "Lệnh đang khớp nhiều phòng, vui lòng nói rõ hơn.",
      );
    }

    if (topRoomScore === 0) {
      matchedRoom = undefined;
    }

    // If the user explicitly mentions a room but we cannot resolve it,
    // fail fast to avoid controlling a wrong room/device.
    const userMentionedRoom = /\b(phòng|phong|room)\b/u.test(sanitizedText);
    if (userMentionedRoom && !matchedRoom) {
      throw new ServiceError(
        404,
        "Không tìm thấy phòng phù hợp trong câu lệnh.",
      );
    }

    const roomFilter = matchedRoom ? { roomId: matchedRoom._id } : {};
    const controllableDevices = await Device.find({
      ...roomFilter,
      type: { $in: ["light", "fan"] },
    }).populate("roomId", "name");

    if (controllableDevices.length === 0) {
      throw new ServiceError(404, "Không tìm thấy thiết bị có thể điều khiển.");
    }

    const rankedDevices = controllableDevices
      .map((device) => ({
        device,
        score: this.scoreDeviceMatch(sanitizedText, device.name),
      }))
      .sort((a, b) => b.score - a.score);

    let targetDevice = rankedDevices[0]?.device;
    const topScore = rankedDevices[0]?.score ?? 0;

    if (!targetDevice || topScore === 0) {
      if (controllableDevices.length === 1) {
        targetDevice = controllableDevices[0]; // vì nếu chỉ có 1 thiết bị thì dù có khớp tên hay không cũng sẽ điều khiển thiết bị đó
      } else {
        throw new ServiceError(
          404,
          "Không xác định được tên thiết bị trong câu lệnh.",
        );
      }
    }

    if (
      rankedDevices.length > 1 &&
      topScore > 0 &&
      rankedDevices[1].score === topScore
    ) {
      throw new ServiceError(
        409,
        "Lệnh đang khớp nhiều thiết bị, vui lòng nói rõ hơn.",
      );
    }

    const commandResult = await this.sendCommand(
      targetDevice._id.toString(),
      { action },
      user,
    );

    const roomName = matchedRoom
      ? matchedRoom.name
      : (targetDevice.roomId as any)?.name;

    return {
      action: commandResult.action,
      deviceName: commandResult.deviceName,
      roomName,
      rawText: payload.text,
    };
  }

  async getLogs(id: string, startDate?: string, endDate?: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    return ActionLog.find({ deviceId: device._id })
      .where("createdAt")
      .gte(new Date(startDate || 0).getTime())
      .lte(new Date(endDate || Date.now()).getTime())
      .sort({ createdAt: -1 });
  }

  async getCurrentData(id: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const data = await Data.findOne({ deviceId: device._id }).sort({
      recordedAt: -1,
    });

    return data;
  }

  async getCurrentAction(id: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const log = await ActionLog.findOne({ deviceId: device._id }).sort({
      createdAt: -1,
    });

    return log;
  }
}

const deviceService = new DeviceService();

export default deviceService;
