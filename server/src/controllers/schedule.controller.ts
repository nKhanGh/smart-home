import { Response } from "express";
import { AuthRequest } from "../types";
import {
  AddScheduleInput,
  UpdateScheduleInput,
} from "../models/ScheduleSchema";
import scheduleService, {
  ScheduleService,
  ScheduleServiceError,
} from "../services/schedule.service";

export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedules = await this.service.getSchedules(req.query.deviceId);
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

  getScheduleById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.getScheduleById(req.params.id);
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

  addSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const schedule = await this.service.addSchedule(
        req.body as AddScheduleInput,
      );
      res
        .status(201)
        .json({ code: "201", msg: "Tạo lịch thành công.", schedule });
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

  deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.deleteSchedule(req.params.id);
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
}

const scheduleController = new ScheduleController(scheduleService);

export default scheduleController;
