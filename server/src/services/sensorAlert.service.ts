import { Types } from "mongoose";
import SensorAlert from "../models/SensorAlertSchema";
import Device from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";

export class SensorAlertService {
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

  async getSensorAlerts(deviceId?: unknown, page?: unknown, size?: unknown) {
    const filters: { deviceId?: Types.ObjectId } = {};

    if (typeof deviceId === "string" && deviceId.trim()) {
      if (!Types.ObjectId.isValid(deviceId)) {
        throw new ServiceError(400, "deviceId không hợp lệ.");
      }
      filters.deviceId = new Types.ObjectId(deviceId);
    }

    const safePage = this.parsePositiveInt(page, 1, 1);
    const safeSize = this.parsePositiveInt(size, 20, 1, 500);
    const skip = (safePage - 1) * safeSize;

    const [totalElement, listSensorAlert] = await Promise.all([
      SensorAlert.countDocuments(filters),
      SensorAlert.find(filters)
        .populate("deviceId", "name key type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeSize),
    ]);

    return this.buildPaginatedResult(
      totalElement,
      safePage,
      safeSize,
      listSensorAlert,
    );
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

  async getSensorAlertsByDeviceId(
    deviceId: string,
    page?: unknown,
    size?: unknown,
    startDate?: unknown,
    endDate?: unknown,
  ) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ServiceError(400, "deviceId không hợp lệ.");
    }

    const device = await Device.findById(deviceId);
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

    const createdAtFilter: { $gte?: Date; $lte?: Date } = {};

    if (start) {
      createdAtFilter.$gte = start;
    }

    if (end) {
      createdAtFilter.$lte = end;
    }

    const query: {
      deviceId: Types.ObjectId;
      createdAt?: { $gte?: Date; $lte?: Date };
    } = {
      deviceId: new Types.ObjectId(deviceId),
    };

    if (Object.keys(createdAtFilter).length > 0) {
      query.createdAt = createdAtFilter;
    }

    const [totalElement, listSensorAlert] = await Promise.all([
      SensorAlert.countDocuments(query),

      SensorAlert.find(query)
        .populate("deviceId", "name key type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeSize),

      SensorAlert.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            maxValue: { $max: "$value" },
            minValue: { $min: "$value" },
            averageValue: { $avg: "$value" },
          },
        },
      ]),
    ]);

    const statsResult = await SensorAlert.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          maxValue: {
            $max: {
              $toDouble: "$value",
            },
          },
          minValue: {
            $min: {
              $toDouble: "$value",
            },
          },
          averageValue: {
            $avg: {
              $toDouble: "$value",
            },
          },
        },
      },
    ]);

    const stats = statsResult[0] || {
      maxValue: null,
      minValue: null,
      averageValue: null,
    };

    return {
      ...this.buildPaginatedResult(
        totalElement,
        safePage,
        safeSize,
        listSensorAlert,
      ),

      max: stats.maxValue,
      min: stats.minValue,
      average: stats.averageValue
        ? Number(stats.averageValue.toFixed(2))
        : null,
    };
  }
}

const sensorAlertService = new SensorAlertService();

export default sensorAlertService;
