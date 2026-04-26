import { Response } from "express";
import { AuthRequest } from "../types";
import {
  AddDeviceActionScheduleInput,
  UpdateDeviceActionScheduleInput,
} from "../models/DeviceActionScheduleValidation";
import {
  AddMotionWatchScheduleInput,
  UpdateMotionWatchScheduleInput,
} from "../models/MotionWatchScheduleValidation";
import scheduleService, { ScheduleService } from "../services/schedule.service";
import handleControllerError from "../utils/handleControllerError";

type UpdateScheduleInput =
  | UpdateDeviceActionScheduleInput
  | UpdateMotionWatchScheduleInput;

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

  switchScheduleStatus = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
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

  getMotionWatchSchedules = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const deviceId = String(req.query.deviceId ?? "");
      const schedules = await this.service.getMotionWatchSchedules(deviceId);
      res.status(200).json(schedules);
    } catch (err) {
      handleControllerError(err, res, "Error fetching motion watch schedules:");
    }
  };

  addDeviceActionSchedule = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const schedule = await this.service.addDeviceActionSchedule(
        req.body as AddDeviceActionScheduleInput,
      );
      res.status(201).json({
        code: "201",
        msg: "Tạo lịch điều khiển thiết bị thành công.",
        schedule,
      });
    } catch (err) {
      handleControllerError(err, res, "Error creating device action schedule:");
    }
  };

  addMotionWatchSchedule = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const schedule = await this.service.addMotionWatchSchedule(
        req.body as AddMotionWatchScheduleInput,
      );
      res.status(201).json({
        code: "201",
        msg: "Tạo lịch giám sát chuyển động thành công.",
        schedule,
      });
    } catch (err) {
      handleControllerError(err, res, "Error creating motion watch schedule:");
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

  updateMotionWatchSchedule = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const schedule = await this.service.updateMotionWatchSchedule(
        req.params.id,
        req.body as UpdateMotionWatchScheduleInput,
      );
      res
        .status(200)
        .json({
          code: "200",
          msg: "Cập nhật lịch motion watch thành công.",
          schedule,
        });
    } catch (err) {
      handleControllerError(err, res, "Error updating motion watch schedule:");
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

  deleteMotionWatchSchedule = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      await this.service.deleteMotionWatchSchedule(req.params.id);
      res
        .status(200)
        .json({ code: "200", msg: "Xóa lịch motion watch thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error deleting motion watch schedule:");
    }
  };
}

const scheduleController = new ScheduleController(scheduleService);

export default scheduleController;
