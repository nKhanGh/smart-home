import { Response } from "express";
import { AuthRequest } from "../types";
import sensorAlertService, {
  SensorAlertService,
  SensorAlertServiceError,
} from "../services/sensorAlert.service";

export class SensorAlertController {
  constructor(private readonly service: SensorAlertService) {}

  getSensorAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const alerts = await this.service.getSensorAlerts(
        req.query.deviceId,
        req.query.limit,
      );
      res.status(200).json(alerts);
    } catch (err) {
      if (err instanceof SensorAlertServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching sensor alerts:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getSensorAlertById = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const alert = await this.service.getSensorAlertById(req.params.id);
      res.status(200).json(alert);
    } catch (err) {
      if (err instanceof SensorAlertServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching sensor alert:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getSensorAlertsByDeviceId = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const alerts = await this.service.getSensorAlertsByDeviceId(
        req.params.deviceId,
        req.query.limit,
      );
      res.status(200).json(alerts);
    } catch (err) {
      if (err instanceof SensorAlertServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching sensor alerts by device id:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const sensorAlertController = new SensorAlertController(sensorAlertService);

export default sensorAlertController;
