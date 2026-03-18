import { Types } from "mongoose";
import SensorAlert from "../models/SensorAlertSchema";
import Device from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";

export class SensorAlertService {
  private parseLimit(limit: unknown, max: number, fallback: number): number {
    const parsed = typeof limit === "string" ? Number(limit) : Number.NaN;
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), max)
      : fallback;
  }

  async getSensorAlerts(deviceId?: unknown, limit?: unknown) {
    const filters: { deviceId?: Types.ObjectId } = {};

    if (typeof deviceId === "string" && deviceId.trim()) {
      if (!Types.ObjectId.isValid(deviceId)) {
        throw new ServiceError(400, "deviceId không hợp lệ.");
      }
      filters.deviceId = new Types.ObjectId(deviceId);
    }

    const safeLimit = this.parseLimit(limit, 500, 100);

    return SensorAlert.find(filters)
      .populate("deviceId", "name key type")
      .sort({ createdAt: -1 })
      .limit(safeLimit);
  }

  async getSensorAlertById(id: string) {
    const alert = await SensorAlert.findById(id).populate(
      "deviceId",
      "name key type",
    );
    if (!alert) {
      throw new ServiceError(404, "SensorAlert not found.");
    }
    return alert;
  }

  async getSensorAlertsByDeviceId(deviceId: string, limit?: unknown) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ServiceError(400, "deviceId không hợp lệ.");
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const safeLimit = this.parseLimit(limit, 500, 100);

    return SensorAlert.find({ deviceId: new Types.ObjectId(deviceId) })
      .populate("deviceId", "name key type")
      .sort({ createdAt: -1 })
      .limit(safeLimit);
  }
}

const sensorAlertService = new SensorAlertService();

export default sensorAlertService;
