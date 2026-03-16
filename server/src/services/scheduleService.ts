import { Types } from "mongoose";
import Schedule, {
  AddScheduleInput,
  UpdateScheduleInput,
} from "../models/ScheduleSchema";
import Device from "../models/DeviceSchema";

export class ScheduleServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getSchedules = async (deviceId?: unknown) => {
  const filters: { deviceId?: Types.ObjectId } = {};

  if (typeof deviceId === "string" && deviceId.trim()) {
    if (!Types.ObjectId.isValid(deviceId)) {
      throw new ScheduleServiceError(400, "deviceId không hợp lệ.");
    }
    filters.deviceId = new Types.ObjectId(deviceId);
  }

  return Schedule.find(filters)
    .populate("deviceId", "name key type")
    .sort({ createdAt: -1 });
};

export const getScheduleById = async (id: string) => {
  const schedule = await Schedule.findById(id).populate(
    "deviceId",
    "name key type",
  );
  if (!schedule) {
    throw new ScheduleServiceError(404, "Schedule not found.");
  }
  return schedule;
};

export const getSchedulesByDeviceId = async (deviceId: string) => {
  if (!Types.ObjectId.isValid(deviceId)) {
    throw new ScheduleServiceError(400, "deviceId không hợp lệ.");
  }

  const device = await Device.findById(deviceId);
  if (!device) {
    throw new ScheduleServiceError(404, "Device not found.");
  }

  return Schedule.find({ deviceId: new Types.ObjectId(deviceId) })
    .populate("deviceId", "name key type")
    .sort({ createdAt: -1 });
};

export const addSchedule = async (payload: AddScheduleInput) => {
  const device = await Device.findById(payload.deviceId);
  if (!device) {
    throw new ScheduleServiceError(404, "Device not found.");
  }

  return Schedule.create({
    deviceId: device._id,
    triggerTime: payload.triggerTime,
    action: payload.action,
    repeatDays: payload.repeatDays ?? [],
  });
};

export const updateSchedule = async (
  id: string,
  payload: UpdateScheduleInput,
) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new ScheduleServiceError(404, "Schedule not found.");
  }

  if (payload.deviceId) {
    const device = await Device.findById(payload.deviceId);
    if (!device) {
      throw new ScheduleServiceError(404, "Device not found.");
    }
    schedule.deviceId = device._id as Types.ObjectId;
  }

  if (payload.triggerTime !== undefined) {
    schedule.triggerTime = payload.triggerTime;
  }
  if (payload.action !== undefined) {
    schedule.action = payload.action;
  }
  if (payload.repeatDays !== undefined) {
    schedule.repeatDays = payload.repeatDays;
  }

  await schedule.save();
  return schedule;
};

export const deleteSchedule = async (id: string) => {
  const schedule = await Schedule.findByIdAndDelete(id);
  if (!schedule) {
    throw new ScheduleServiceError(404, "Schedule not found.");
  }
};
