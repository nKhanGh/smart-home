import { Types } from "mongoose";
import SensorAlert from "../models/SensorAlertSchema";
import Device from "../models/DeviceSchema";

export class SensorAlertServiceError extends Error {
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

export const getSensorAlerts = async (deviceId?: unknown, limit?: unknown) => {
  const filters: { deviceId?: Types.ObjectId } = {};

  if (typeof deviceId === "string" && deviceId.trim()) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new SensorAlertServiceError(400, "deviceId không hợp lệ.");
    }
    filters.deviceId = new Types.ObjectId(deviceId);
  }

  const safeLimit = parseLimit(limit, 500, 100);

  return SensorAlert.find(filters)
    .populate("deviceId", "name key type")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

export const getSensorAlertById = async (id: string) => {
  const alert = await SensorAlert.findById(id).populate(
    "deviceId",
    "name key type",
  );
  if (!alert) {
    throw new SensorAlertServiceError(404, "SensorAlert not found.");
  }
  return alert;
};

export const getSensorAlertsByDeviceId = async (
  deviceId: string,
  limit?: unknown,
) => {
  if (!Types.ObjectId.isValid(deviceId)) {
    throw new SensorAlertServiceError(400, "deviceId không hợp lệ.");
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw new SensorAlertServiceError(404, "Device not found.");
  }

  const safeLimit = parseLimit(limit, 500, 100);

  return SensorAlert.find({ deviceId: new Types.ObjectId(deviceId) })
    .populate("deviceId", "name key type")
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};
