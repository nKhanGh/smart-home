import { Types } from "mongoose";
import Data from "../models/DataSchema";
import Device from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";

export class DataService {
  private parseLimit(limit: unknown, max: number, fallback: number): number {
    const parsed = typeof limit === "string" ? Number(limit) : Number.NaN;
    return Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), max)
      : fallback;
  }

  async getDataList(deviceId?: unknown, type?: unknown, limit?: unknown) {
    const filters: { deviceId?: Types.ObjectId; type?: string } = {};

    if (typeof deviceId === "string" && deviceId.trim()) {
      if (!Types.ObjectId.isValid(deviceId)) {
        throw new ServiceError(400, "deviceId không hợp lệ.");
      }
      filters.deviceId = new Types.ObjectId(deviceId);
    }

    if (typeof type === "string" && type.trim()) {
      filters.type = type;
    }

    const safeLimit = this.parseLimit(limit, 1000, 200);

    return Data.find(filters)
      .populate("deviceId", "name key type")
      .sort({ recordedAt: -1 })
      .limit(safeLimit);
  }

  async getDataById(id: string) {
    const data = await Data.findById(id).populate("deviceId", "name key type");
    if (!data) {
      throw new ServiceError(404, "Data not found.");
    }
    return data;
  }

  async getDataByDeviceId(deviceId: string, type?: unknown, limit?: unknown) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ServiceError(400, "deviceId không hợp lệ.");
    }

    console.log("Fetching data for deviceId:", deviceId, "with type:", type, "and limit:", limit);

    const device = await Device.findOne({ _id: deviceId });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const filters: { deviceId: Types.ObjectId; type?: string } = {
      deviceId: new Types.ObjectId(deviceId),
    };

    if (typeof type === "string" && type.trim()) {
      filters.type = type;
    }

    const safeLimit = this.parseLimit(limit, 1000, 200);

    return Data.find(filters)
      .populate("deviceId", "name key type")
      .sort({ recordedAt: -1 })
      .limit(safeLimit);
  }
}

const dataService = new DataService();

export default dataService;
