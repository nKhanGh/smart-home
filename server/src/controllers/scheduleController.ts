import { Response } from "express";
import { AuthRequest } from "../types";
import {
  AddScheduleInput,
  AddScheduleSchema,
  UpdateScheduleInput,
  UpdateScheduleSchema,
} from "../models/ScheduleSchema";
import {
  addSchedule as addScheduleService,
  deleteSchedule as deleteScheduleService,
  getScheduleById as getScheduleByIdService,
  getSchedules as getSchedulesService,
  getSchedulesByDeviceId as getSchedulesByDeviceIdService,
  ScheduleServiceError,
  updateSchedule as updateScheduleService,
} from "../services/scheduleService";

export const getSchedules = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const schedules = await getSchedulesService(req.query.deviceId);

    res.status(200).json(schedules);
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error fetching schedules:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const getScheduleById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const schedule = await getScheduleByIdService(req.params.id);

    res.status(200).json(schedule);
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error fetching schedule:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const getSchedulesByDeviceId = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const schedules = await getSchedulesByDeviceIdService(req.params.deviceId);

    res.status(200).json(schedules);
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error fetching schedules by device id:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const addSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const payload = AddScheduleSchema.parse(req.body) as AddScheduleInput;
    const schedule = await addScheduleService(payload);

    res.status(201).json({
      code: "201",
      msg: "Tạo lịch thành công.",
      schedule,
    });
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error creating schedule:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const updateSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const payload = UpdateScheduleSchema.parse(req.body) as UpdateScheduleInput;
    const schedule = await updateScheduleService(req.params.id, payload);

    res.status(200).json({
      code: "200",
      msg: "Cập nhật lịch thành công.",
      schedule,
    });
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error updating schedule:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await deleteScheduleService(req.params.id);

    res.status(200).json({ code: "200", msg: "Xóa lịch thành công." });
  } catch (err) {
    if (err instanceof ScheduleServiceError) {
      res
        .status(err.statusCode)
        .json({ code: `${err.statusCode}`, msg: err.message });
      return;
    }
    console.error("Error deleting schedule:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
