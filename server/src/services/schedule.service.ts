import { Types } from "mongoose";
import {
  AddDeviceActionScheduleInput,
  UpdateDeviceActionScheduleInput,
} from "../models/DeviceActionScheduleValidation";
import {
  AddMotionWatchScheduleInput,
  UpdateMotionWatchScheduleInput,
} from "../models/MotionWatchScheduleValidation";
import Device from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";
import DeviceActionSchedule, {
  IDeviceActionScheduleDoc,
} from "../models/DeviceActionScheduleSchema";
import MotionWatchSchedule, {
  IMotionWatchScheduleDoc,
} from "../models/MotionWatchScheduleSchema";

type ScheduleType = "deviceAction" | "motionWatch";
type AnyScheduleDoc = IDeviceActionScheduleDoc | IMotionWatchScheduleDoc;
type UpdateScheduleInput =
  UpdateDeviceActionScheduleInput & UpdateMotionWatchScheduleInput;
type ScheduleOutput = Record<string, unknown> & {
  createdAt?: Date;
  scheduleType: ScheduleType;
};

export class ScheduleService {
  private async getDeviceOrThrow(deviceId: string) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    return device;
  }

  private ensureMotionWatchDeviceType(
    scheduleType: ScheduleType,
    deviceType: string,
  ): void {
    if (scheduleType === "motionWatch" && deviceType !== "motionSensor") {
      throw new ServiceError(
        400,
        "Lịch giám sát chuyển động chỉ áp dụng cho motionSensor.",
      );
    }
  }

  private toOutput(schedule: AnyScheduleDoc, scheduleType: ScheduleType): ScheduleOutput {
    return {
      ...(schedule.toObject() as Record<string, unknown>),
      scheduleType,
    };
  }

  private sortByCreatedAtDesc<T extends { createdAt?: Date }>(items: T[]): T[] {
    return items.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  private async findScheduleById(
    id: string,
  ): Promise<{ type: ScheduleType; schedule: AnyScheduleDoc } | null> {
    const deviceAction = await DeviceActionSchedule.findById(id);
    if (deviceAction) {
      return { type: "deviceAction", schedule: deviceAction };
    }

    const motionWatch = await MotionWatchSchedule.findById(id);
    if (motionWatch) {
      return { type: "motionWatch", schedule: motionWatch };
    }

    return null;
  }

  private hasMotionWatchOnlyFields(payload: UpdateScheduleInput): boolean {
    return (
      payload.startTime !== undefined ||
      payload.endTime !== undefined ||
      payload.triggerCount !== undefined ||
      payload.countWindowMinutes !== undefined ||
      payload.minSignalIntervalSeconds !== undefined ||
      payload.cooldownMinutes !== undefined
    );
  }

  private hasDeviceActionOnlyFields(payload: UpdateScheduleInput): boolean {
    return payload.triggerTime !== undefined || payload.action !== undefined;
  }

  async getSchedules(deviceId?: unknown) {
    const filters: { deviceId?: Types.ObjectId } = {};

    if (typeof deviceId === "string" && deviceId.trim()) {
      if (!Types.ObjectId.isValid(deviceId)) {
        throw new ServiceError(400, "deviceId không hợp lệ.");
      }
      filters.deviceId = new Types.ObjectId(deviceId);
    }

    const [deviceActionSchedules, motionWatchSchedules] = await Promise.all([
      DeviceActionSchedule.find(filters)
        .populate("deviceId", "name key type")
        .sort({ createdAt: -1 }),
      MotionWatchSchedule.find(filters)
        .populate("deviceId", "name key type")
        .sort({ createdAt: -1 }),
    ]);

    return this.sortByCreatedAtDesc([
      ...deviceActionSchedules.map((item) => this.toOutput(item, "deviceAction")),
      ...motionWatchSchedules.map((item) => this.toOutput(item, "motionWatch")),
    ]);
  }

  async switchScheduleStatus(id: string) {
    const found = await this.findScheduleById(id);
    if (!found) {
      throw new ServiceError(404, "Schedule not found.");
    }

    found.schedule.active = !found.schedule.active;
    await found.schedule.save();
    return this.toOutput(found.schedule, found.type);
  }

  async getScheduleById(id: string) {
    const [deviceAction, motionWatch] = await Promise.all([
      DeviceActionSchedule.findById(id).populate("deviceId", "name key type"),
      MotionWatchSchedule.findById(id).populate("deviceId", "name key type"),
    ]);

    if (deviceAction) {
      return this.toOutput(deviceAction, "deviceAction");
    }

    if (motionWatch) {
      return this.toOutput(motionWatch, "motionWatch");
    }

    if (!deviceAction && !motionWatch) {
      throw new ServiceError(404, "Schedule not found.");
    }

    throw new ServiceError(404, "Schedule not found.");
  }

  async getSchedulesByDeviceId(deviceId: string) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ServiceError(400, "deviceId không hợp lệ.");
    }

    await this.getDeviceOrThrow(deviceId);

    return this.getSchedules(deviceId);
  }

  async getMotionWatchSchedules(deviceId: string) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ServiceError(400, "deviceId không hợp lệ.");
    }

    await this.getDeviceOrThrow(deviceId);

    const schedules = await MotionWatchSchedule.find({
      deviceId: new Types.ObjectId(deviceId),
    })
      .populate("deviceId", "name key type")
      .sort({ createdAt: -1 });

    return schedules.map((item) => this.toOutput(item, "motionWatch"));
  }

  async addDeviceActionSchedule(payload: AddDeviceActionScheduleInput) {
    const device = await this.getDeviceOrThrow(payload.deviceId);

    const schedule = await DeviceActionSchedule.create({
      deviceId: device._id,
      triggerTime: payload.triggerTime,
      action: payload.action,
      repeatDays: payload.repeatDays ?? [],
      active: payload.active ?? true,
    });

    return this.toOutput(schedule, "deviceAction");
  }

  async addMotionWatchSchedule(payload: AddMotionWatchScheduleInput) {
    const device = await this.getDeviceOrThrow(payload.deviceId);
    this.ensureMotionWatchDeviceType("motionWatch", device.type);

    const schedule = await MotionWatchSchedule.create({
      deviceId: device._id,
      repeatDays: payload.repeatDays ?? [],
      startTime: payload.startTime,
      endTime: payload.endTime,
      triggerCount: payload.triggerCount ?? 3,
      countWindowMinutes: payload.countWindowMinutes ?? 5,
      minSignalIntervalSeconds: payload.minSignalIntervalSeconds ?? 8,
      cooldownMinutes: payload.cooldownMinutes ?? 10,
      active: payload.active ?? true,
    });

    return this.toOutput(schedule, "motionWatch");
  }

  async updateSchedule(id: string, payload: UpdateScheduleInput) {
    const found = await this.findScheduleById(id);
    if (!found) {
      throw new ServiceError(404, "Schedule not found.");
    }

    const { schedule, type } = found;

    if (payload.deviceId) {
      const device = await this.getDeviceOrThrow(payload.deviceId);
      schedule.deviceId = device._id;

      this.ensureMotionWatchDeviceType(type, device.type);
    }

    if (payload.repeatDays !== undefined) {
      schedule.repeatDays = payload.repeatDays;
    }
    if (payload.active !== undefined) {
      schedule.active = payload.active;
    }

    if (type === "deviceAction") {
      if (this.hasMotionWatchOnlyFields(payload)) {
        throw new ServiceError(400, "Field motionWatch không hợp lệ với deviceAction.");
      }

      const deviceActionSchedule = schedule as IDeviceActionScheduleDoc;

      if (payload.triggerTime !== undefined) {
        deviceActionSchedule.triggerTime = payload.triggerTime;
      }
      if (payload.action !== undefined) {
        deviceActionSchedule.action = payload.action;
      }

      if (!deviceActionSchedule.triggerTime || !deviceActionSchedule.action) {
        throw new ServiceError(
          400,
          "Lịch deviceAction cần triggerTime và action.",
        );
      }
    }

    if (type === "motionWatch") {
      if (this.hasDeviceActionOnlyFields(payload)) {
        throw new ServiceError(400, "Field deviceAction không hợp lệ với motionWatch.");
      }

      const motionWatchSchedule = schedule as IMotionWatchScheduleDoc;

      if (payload.startTime !== undefined) {
        motionWatchSchedule.startTime = payload.startTime;
      }
      if (payload.endTime !== undefined) {
        motionWatchSchedule.endTime = payload.endTime;
      }
      if (payload.triggerCount !== undefined) {
        motionWatchSchedule.triggerCount = payload.triggerCount;
      }
      if (payload.countWindowMinutes !== undefined) {
        motionWatchSchedule.countWindowMinutes = payload.countWindowMinutes;
      }
      if (payload.minSignalIntervalSeconds !== undefined) {
        motionWatchSchedule.minSignalIntervalSeconds =
          payload.minSignalIntervalSeconds;
      }
      if (payload.cooldownMinutes !== undefined) {
        motionWatchSchedule.cooldownMinutes = payload.cooldownMinutes;
      }

      if (!motionWatchSchedule.startTime || !motionWatchSchedule.endTime) {
        throw new ServiceError(
          400,
          "Lịch motionWatch cần startTime và endTime.",
        );
      }
    }

    await schedule.save();
    return this.toOutput(schedule, type);
  }

  async updateMotionWatchSchedule(
    id: string,
    payload: UpdateMotionWatchScheduleInput,
  ) {
    const schedule = await MotionWatchSchedule.findById(id);
    if (!schedule) {
      throw new ServiceError(404, "MotionWatch schedule not found.");
    }

    if (payload.deviceId) {
      const device = await this.getDeviceOrThrow(payload.deviceId);
      this.ensureMotionWatchDeviceType("motionWatch", device.type);
      schedule.deviceId = device._id;
    }

    if (payload.repeatDays !== undefined) {
      schedule.repeatDays = payload.repeatDays;
    }
    if (payload.startTime !== undefined) {
      schedule.startTime = payload.startTime;
    }
    if (payload.endTime !== undefined) {
      schedule.endTime = payload.endTime;
    }
    if (payload.triggerCount !== undefined) {
      schedule.triggerCount = payload.triggerCount;
    }
    if (payload.countWindowMinutes !== undefined) {
      schedule.countWindowMinutes = payload.countWindowMinutes;
    }
    if (payload.minSignalIntervalSeconds !== undefined) {
      schedule.minSignalIntervalSeconds = payload.minSignalIntervalSeconds;
    }
    if (payload.cooldownMinutes !== undefined) {
      schedule.cooldownMinutes = payload.cooldownMinutes;
    }
    if (payload.active !== undefined) {
      schedule.active = payload.active;
    }

    if (!schedule.startTime || !schedule.endTime) {
      throw new ServiceError(400, "Lịch motionWatch cần startTime và endTime.");
    }

    await schedule.save();
    return this.toOutput(schedule, "motionWatch");
  }

  async deleteSchedule(id: string) {
    const [deletedDeviceAction, deletedMotionWatch] = await Promise.all([
      DeviceActionSchedule.findByIdAndDelete(id),
      MotionWatchSchedule.findByIdAndDelete(id),
    ]);

    if (!deletedDeviceAction && !deletedMotionWatch) {
      throw new ServiceError(404, "Schedule not found.");
    }
  }

  async deleteMotionWatchSchedule(id: string) {
    const deleted = await MotionWatchSchedule.findByIdAndDelete(id);
    if (!deleted) {
      throw new ServiceError(404, "MotionWatch schedule not found.");
    }
  }
}

const scheduleService = new ScheduleService();

export default scheduleService;
