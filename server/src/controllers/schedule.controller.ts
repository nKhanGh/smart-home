import { Response } from "express";
import { AuthRequest } from "../types";
import {
  AddScheduleInput,
  UpdateScheduleInput,
} from "../models/ScheduleSchema";
import scheduleService, { ScheduleService } from "../services/schedule.service";
import handleControllerError from "../utils/handleControllerError";

export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedules = await this.service.getSchedules(req.query.deviceId);
      res.status(200).json(schedules);
    } catch (err) {
      handleControllerError(err, res, "Error fetching schedules:");
    }
  };

  switchScheduleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.switchScheduleStatus(req.params.id);
      res.status(200).json(schedule);
    } catch (err) {
      handleControllerError(err, res, "Error switching schedule status:");
    }
  };

  getScheduleById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.getScheduleById(req.params.id);
      res.status(200).json(schedule);
    } catch (err) {
      handleControllerError(err, res, "Error fetching schedule:");
    }
  };

  getSchedulesByDeviceId = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const schedules = await this.service.getSchedulesByDeviceId(
        req.params.deviceId,
      );
      res.status(200).json(schedules);
    } catch (err) {
      handleControllerError(err, res, "Error fetching schedules by device id:");
    }
  };

  addSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.addSchedule(
        req.body as AddScheduleInput,
      );
      res
        .status(201)
        .json({ code: "201", msg: "Tạo lịch thành công.", schedule });
    } catch (err) {
      handleControllerError(err, res, "Error creating schedule:");
    }
  };

  updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.updateSchedule(
        req.params.id,
        req.body as UpdateScheduleInput,
      );
      res
        .status(200)
        .json({ code: "200", msg: "Cập nhật lịch thành công.", schedule });
    } catch (err) {
      handleControllerError(err, res, "Error updating schedule:");
    }
  };

  deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.deleteSchedule(req.params.id);
      res.status(200).json({ code: "200", msg: "Xóa lịch thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error deleting schedule:");
    }
  };
}

const scheduleController = new ScheduleController(scheduleService);

export default scheduleController;
