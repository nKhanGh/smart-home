import { Response } from "express";
import { AuthRequest } from "../types";
import sensorAlertService, {
  SensorAlertService,
} from "../services/sensorAlert.service";
import handleControllerError from "../utils/handleControllerError";

export class SensorAlertController {
  constructor(private readonly service: SensorAlertService) {}

  getSensorAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const alerts = await this.service.getSensorAlerts(
        req.query.deviceId,
        req.query.page,
        req.query.size,
      );
      res.status(200).json(alerts);
    } catch (err) {
      handleControllerError(err, res, "Error fetching sensor alerts:");
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
      handleControllerError(err, res, "Error fetching sensor alert:");
    }
  };

  getSensorAlertsByDeviceId = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const alerts = await this.service.getSensorAlertsByDeviceId(
        req.params.deviceId,
        req.query.page,
        req.query.size,
        req.query.startDate,
        req.query.endDate,
      );
      res.status(200).json(alerts);
    } catch (err) {
      handleControllerError(
        err,
        res,
        "Error fetching sensor alerts by device id:",
      );
    }
  };
}

const sensorAlertController = new SensorAlertController(sensorAlertService);

export default sensorAlertController;
