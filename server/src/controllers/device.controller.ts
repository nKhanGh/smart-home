import { Response } from "express";
import {
  AddDeviceInput,
  SendCommandInput,
  UpdateDeviceInput,
} from "../models/DeviceSchema";
import { AuthRequest } from "../types";
import deviceService, {
  DeviceService,
  DeviceServiceError,
} from "../services/device.service";

export class DeviceController {
  constructor(private readonly service: DeviceService) {}

  getDevices = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const devices = await this.service.getDevices();
      res.status(200).json(devices);
    } catch (err) {
      console.error("Error fetching devices:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getDeviceById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const device = await this.service.getDeviceById(req.params.id);
      res.status(200).json(device);
    } catch (err) {
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching device:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getDeviceData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDeviceData(req.params.id);
      res.status(200).json(data);
    } catch (err) {
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  addDevice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const device = await this.service.addDevice(
        req.body as AddDeviceInput,
        req.user?.id,
      );
      res
        .status(201)
        .json({ code: "201", msg: "Thêm thiết bị thành công.", device });
    } catch (err: unknown) {
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "Server Error.";
      res.status(500).json({ code: "500", msg: message });
    }
  };

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
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error updating device:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  deleteDevice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.deleteDevice(req.params.id);
      res.status(200).json({ code: "200", msg: "Xóa thiết bị thành công." });
    } catch (err) {
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error deleting device:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
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
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "Server Error.";
      res.status(500).json({ code: "500", msg: message });
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
      if (err instanceof DeviceServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const deviceController = new DeviceController(deviceService);

export default deviceController;
