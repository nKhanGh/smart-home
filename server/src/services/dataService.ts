import { Types } from "mongoose";
import Data from "../models/DataSchema";
import Device from "../models/DeviceSchema";

export class DataServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const parseLimit = (limit: unknown, max: number, fallback: number): number => {
  const parsed = typeof limit === "string" ? Number(limit) : NaN;
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), max)
    : fallback;
};

export const getDataList = async (
  deviceId?: unknown,
  type?: unknown,
  limit?: unknown,
) => {
  const filters: { deviceId?: Types.ObjectId; type?: string } = {};

  if (typeof deviceId === "string" && deviceId.trim()) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new DataServiceError(400, "deviceId không hợp lệ.");
    }
    filters.deviceId = new Types.ObjectId(deviceId);
  }

  if (typeof type === "string" && type.trim()) {
    filters.type = type;
  }

  const safeLimit = parseLimit(limit, 1000, 200);

  return Data.find(filters)
    .populate("deviceId", "name key type")
    .sort({ recordedAt: -1 })
    .limit(safeLimit);
};

export const getDataById = async (id: string) => {
  const data = await Data.findById(id).populate("deviceId", "name key type");
  if (!data) {
    throw new DataServiceError(404, "Data not found.");
  }
  return data;
};

export const getDataByDeviceId = async (
  deviceId: string,
  type?: unknown,
  limit?: unknown,
) => {
  if (!Types.ObjectId.isValid(deviceId)) {
    throw new DataServiceError(400, "deviceId không hợp lệ.");
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw new DataServiceError(404, "Device not found.");
  }

  const filters: { deviceId: Types.ObjectId; type?: string } = {
    deviceId: new Types.ObjectId(deviceId),
  };

  if (typeof type === "string" && type.trim()) {
    filters.type = type;
  }

  const safeLimit = parseLimit(limit, 1000, 200);

  return Data.find(filters)
    .populate("deviceId", "name key type")
    .sort({ recordedAt: -1 })
    .limit(safeLimit);
};
