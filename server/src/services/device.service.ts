import { Types } from "mongoose";
import Device, {
  IDeviceDoc,
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
import bcrypt from "bcryptjs";

type DeviceType = IDeviceDoc["type"];

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

  private mapActionForDevice(
    deviceType: DeviceType,
    action: "on" | "off",
  ): string {
    if (deviceType === "fanDevice") {
      return action === "on" ? "100" : "0";
    }

    if (deviceType === "lightDevice" || deviceType === "doorDevice") {
      return action === "on" ? "1" : "0";
    }

    return action;
  }

  private parsePositiveInt(
    value: unknown,
    fallback: number,
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  ): number {
    const parsed = typeof value === "string" ? Number(value) : Number.NaN;
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const rounded = Math.trunc(parsed);
    return Math.min(Math.max(rounded, min), max);
  }

  private parseDateParam(value: unknown, fieldName: string): Date | null {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ServiceError(400, `${fieldName} không hợp lệ.`);
    }

    return parsed;
  }
  private buildPaginatedResult<T>(
    totalElement: number,
    page: number,
    size: number,
    items: T[],
  ) {
    return {
      currentPage: page,
      size,
      totalPage: totalElement === 0 ? 0 : Math.ceil(totalElement / size),
      totalElement,
      items,
    };
  }

  async getDevices() {
    return (await Device.find().populate("roomId", "name key")).map(
      (device) => ({
        id: device._id,
        ...device.toObject(),
      }),
    );
  }

  async getDeviceById(id: string) {
    const device = await Device.findOne({ _id: id }).populate(
      "roomId",
      "name key",
    );
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    if (device.type.endsWith("Device")) {
      const action = await this.getCurrentAction(id);
      return {
        id: device._id,
        ...device.toObject(),
        currentAction: action?.action || null,
      };
    } else {
      const data = await this.getCurrentData(id);
      const threshold = await Threshold.findOne({ deviceId: device._id });
      return {
        id: device._id,
        ...device.toObject(),
        currentData: data?.value || null,
        threshold: threshold?.value || null,
      };
    }
  }

  async getDeviceData(
    id: string,
    page?: unknown,
    size?: unknown,
    startDate?: unknown,
    endDate?: unknown,
  ) {
    const device = await Device.findById(id);

    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const safePage = this.parsePositiveInt(page, 1, 1);
    const safeSize = this.parsePositiveInt(size, 20, 1, 500);
    const skip = (safePage - 1) * safeSize;

    const start = this.parseDateParam(startDate, "startDate");
    const end = this.parseDateParam(endDate, "endDate");

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    if (start && end && start > end) {
      throw new ServiceError(400, "startDate phải nhỏ hơn hoặc bằng endDate.");
    }

    const query: any = {
      deviceId: device._id,
    };

    if (start || end) {
      query.recordedAt = {};

      if (start) {
        query.recordedAt.$gte = start;
      }

      if (end) {
        query.recordedAt.$lte = end;
      }
    }

    const [totalElement, items, statsResult] = await Promise.all([
      Data.countDocuments(query),

      Data.find(query).sort({ recordedAt: -1 }).skip(skip).limit(safeSize),

      Data.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            maxValue: {
              $max: { $toDouble: "$value" },
            },
            minValue: {
              $min: { $toDouble: "$value" },
            },
            averageValue: {
              $avg: { $toDouble: "$value" },
            },
          },
        },
      ]),
    ]);

    const stats = statsResult[0] || {
      maxValue: null,
      minValue: null,
      averageValue: null,
    };

    return {
      ...this.buildPaginatedResult(totalElement, safePage, safeSize, items),
      max: stats.maxValue,
      min: stats.minValue,
      average:
        stats.averageValue === null
          ? null
          : Number(stats.averageValue.toFixed(2)),
    };
  }

  // async addDevice(payload: AddDeviceInput, userId?: string) {
  //   const { name, description, roomId, type } = payload;

  //   const room = await Room.findOne({ _id: roomId });
  //   if (!room) {
  //     throw new ServiceError(404, "Room not found.");
  //   }

  //   const { data: feed } = await adafruitAPI.post(`/groups/${room.key}/feeds`, {
  //     feed: { name, description },
  //   });

  //   const device = await Device.create({
  //     name,
  //     description,
  //     key: feed.key,
  //     roomId: room._id,
  //     type,
  //     createdBy: userId,
  //   });

  //   await Threshold.create({
  //     deviceId: device._id,
  //     value: 0,
  //     updatedBy: userId,
  //   });

  //   room.devices.push(device._id as never);
  //   await room.save();

  //   mqttService.subscribeFeed(feed.key);

  //   return device;
  // }

  async updateDevice(id: string, payload: UpdateDeviceInput) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const { name, description, roomId, mode, threshold } = payload;
    const newRoom = roomId ? await Room.findById(roomId) : null;
    if (roomId && !newRoom) {
      throw new ServiceError(404, "Room not found.");
    }

    device.name = name ?? device.name;
    device.description = description ?? device.description;
    device.mode = mode ?? device.mode;

    if (threshold !== undefined) {
      await Threshold.findOneAndUpdate(
        { deviceId: device._id },
        { value: threshold },
        { upsert: true },
      );
    }

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

    if (!isRoomChanged && (name !== undefined || description !== undefined)) {
      const feedPayload: any = {};
      if (name !== undefined) feedPayload.name = name;
      if (description !== undefined) feedPayload.description = description;
      await adafruitAPI.put(`/feeds/${device.key}`, {
        feed: feedPayload,
      });
    }

    await device.save();
    return device;
  }

  async updatePassword(id: string, newPassword: string, oldPassword?: string) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    if (device.type !== "doorDevice") {
      throw new ServiceError(400, "Only door devices have passwords.");
    }
    if (device.password && device.password.length > 0) {
      if (!oldPassword) {
        throw new ServiceError(400, "Current password is required.");
      }
      const isMatch = await bcrypt.compare(oldPassword, device.password);
      if (!isMatch) {
        throw new ServiceError(403, "Current password is incorrect.");
      }
    }
    device.password = await bcrypt.hash(newPassword, 10);
    await device.save();
    return { msg: "Password updated successfully." };
  }

  // async deleteDevice(id: string) {
  //   const device = await Device.findOne({ _id: id });
  //   if (!device) {
  //     throw new ServiceError(404, "Device not found.");
  //   }

  //   await adafruitAPI.delete(`/feeds/${device.key}`);
  //   await Room.findByIdAndUpdate(device.roomId, {
  //     $pull: { devices: device._id },
  //   });
  //   await Device.findByIdAndDelete(device._id);
  // }

  async sendCommand(id: string, payload: SendCommandInput, user?: JwtPayload) {
    const device = await Device.findOne({ _id: id });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    if (device.type === "doorDevice") {
      if (!payload.password) {
        throw new ServiceError(400, "Password is required for door devices.");
      }
      const isMatch = await bcrypt.compare(payload.password, device.password);
      if (!isMatch) {
        throw new ServiceError(403, "Incorrect password.");
      }
    }

    mqttService.publish(device.key, payload.action);

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
      type: { $in: ["lightDevice", "fanDevice", "doorDevice"] },
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

    const mappedAction = this.mapActionForDevice(targetDevice.type, action);

    const commandResult = await this.sendCommand(
      targetDevice._id.toString(),
      { action: mappedAction },
      user,
    );

    const roomName = matchedRoom
      ? matchedRoom.name
      : (targetDevice.roomId as any)?.name;

    return {
      action,
      sentValue: commandResult.action,
      deviceName: commandResult.deviceName,
      roomName,
      rawText: payload.text,
    };
  }

  async getLogs(
    id: string,
    page?: unknown,
    size?: unknown,
    startDate?: unknown,
    endDate?: unknown,
  ) {
    const device = await Device.findById(id);

    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const safePage = this.parsePositiveInt(page, 1, 1);
    const safeSize = this.parsePositiveInt(size, 20, 1, 500);
    const skip = (safePage - 1) * safeSize;

    const start = this.parseDateParam(startDate, "startDate");
    const end = this.parseDateParam(endDate, "endDate");

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    if (start && end && start > end) {
      throw new ServiceError(400, "startDate phải nhỏ hơn hoặc bằng endDate.");
    }

    const query: any = {
      deviceId: device._id,
    };

    if (start || end) {
      query.createdAt = {};

      if (start) {
        query.createdAt.$gte = start;
      }

      if (end) {
        query.createdAt.$lte = end;
      }
    }

    const [totalElement, items] = await Promise.all([
      ActionLog.countDocuments(query),

      ActionLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeSize),
    ]);

    return this.buildPaginatedResult(totalElement, safePage, safeSize, items);
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

  async getSensorDevices() {
    return Device.find({
      type: { $in: ["temperatureSensor", "lightSensor", "humiditySensor"] },
    }).populate("roomId", "name");
  }

  async getThresholdDevices() {
    return Device.find({
      type: { $in: ["temperatureSensor", "lightSensor"] },
    }).populate("roomId", "name");
  }
}

const deviceService = new DeviceService();

export default deviceService;
