import { Response } from "express";
import { AuthRequest } from "../types";
import {
  getSensorAlertById as getSensorAlertByIdService,
  getSensorAlerts as getSensorAlertsService,
  getSensorAlertsByDeviceId as getSensorAlertsByDeviceIdService,
  SensorAlertServiceError,
} from "../services/sensorAlertService";

export const getSensorAlerts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const alerts = await getSensorAlertsService(
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

export const getSensorAlertById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const alert = await getSensorAlertByIdService(req.params.id);

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

export const getSensorAlertsByDeviceId = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const alerts = await getSensorAlertsByDeviceIdService(
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
