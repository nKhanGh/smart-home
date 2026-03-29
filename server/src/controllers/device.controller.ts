import { Response } from "express";
import {
  SendCommandInput,
  UpdateDeviceInput,
  VoiceCommandInput,
} from "../models/DeviceSchema";
import { AuthRequest } from "../types";
import deviceService, { DeviceService } from "../services/device.service";
import handleControllerError from "../utils/handleControllerError";

export class DeviceController {
  constructor(private readonly service: DeviceService) {}

  getDevices = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const devices = await this.service.getDevices();
      res.status(200).json(devices);
    } catch (err) {
      handleControllerError(err, res, "Error fetching devices:");
    }
  };

  getDeviceById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const device = await this.service.getDeviceById(req.params.id);
      res.status(200).json(device);
    } catch (err) {
      handleControllerError(err, res, "Error fetching device:");
    }
  };

  getDeviceData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDeviceData(req.params.id);
      res.status(200).json(data);
    } catch (err) {
      handleControllerError(err, res, "Error fetching device data:");
    }
  };

  // addDevice = async (req: AuthRequest, res: Response): Promise<void> => {
  //   try {
  //     const device = await this.service.addDevice(
  //       req.body as AddDeviceInput,
  //       req.user?.id,
  //     );
  //     res
  //       .status(201)
  //       .json({ code: "201", msg: "Thêm thiết bị thành công.", device });
  //   } catch (err: unknown) {
  //     handleControllerError(err, res, "Error creating device:");
  //   }
  // };

  updateDevice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const device = await this.service.updateDevice(
        req.params.id,
        req.body as UpdateDeviceInput,
      );
      res
        .status(200)
        .json({ code: "200", msg: "Cập nhật thành công.", device });
    } catch (err) {
      handleControllerError(err, res, "Error updating device:");
    }
  };

  deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.deleteDevice(req.params.id);
      res.status(200).json({ code: "200", msg: "Xóa thiết bị thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error deleting device:");
    }
  };

  sendCommand = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.sendCommand(
        req.params.id,
        req.body as SendCommandInput,
        req.user,
      );
      res.status(200).json({
        code: "200",
        msg: `Đã gửi lệnh ${result.action} đến ${result.deviceName}.`,
      });
    } catch (err: unknown) {
      handleControllerError(err, res, "Error sending device command:");
    }
  };

  executeVoiceCommand = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.service.executeVoiceCommand(
        req.body as VoiceCommandInput,
        req.user,
      );
      res.status(200).json({
        code: "200",
        msg: `Đã xử lý lệnh giọng nói: ${result.action} ${result.deviceName}${result.roomName ? ` (${result.roomName})` : ""}.`,
        parsed: {
          action: result.action,
          deviceName: result.deviceName,
          roomName: result.roomName,
          rawText: result.rawText,
        },
      });
    } catch (err: unknown) {
      handleControllerError(err, res, "Error executing voice command:");
    }
  };

  getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const logs = await this.service.getLogs(
        req.params.id,
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      res.status(200).json(logs);
    } catch (err) {
      handleControllerError(err, res, "Error fetching logs:");
    }
  };

  getCurrentData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getCurrentData(req.params.id);
      res.status(200).json(data);
    } catch (err) {
      handleControllerError(err, res, "Error fetching current data:");
    }
  };

  getCurrentAction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const action = await this.service.getCurrentAction(req.params.id);
      res.status(200).json(action);
    } catch (err) {
      handleControllerError(err, res, "Error fetching current action:");
    }
  };
}

const deviceController = new DeviceController(deviceService);

export default deviceController;
