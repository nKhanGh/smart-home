import { Response } from "express";
import { AuthRequest } from "../types";
import dataService, { DataService } from "../services/data.service";
import handleControllerError from "../utils/handleControllerError";

export class DataController {
  constructor(private readonly service: DataService) {}

  getDataList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDataList(
        req.query.deviceId,
        req.query.type,
        req.query.limit,
      );
      res.status(200).json(data);
    } catch (err) {
      handleControllerError(err, res, "Error fetching data list:");
    }
  };

  getDataById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDataById(req.params.id);
      res.status(200).json(data);
    } catch (err) {
      handleControllerError(err, res, "Error fetching data detail:");
    }
  };

  getDataByDeviceId = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const data = await this.service.getDataByDeviceId(
        req.params.deviceId,
        req.query.type,
        req.query.limit,
      );
      res.status(200).json(data);
    } catch (err) {
      handleControllerError(err, res, "Error fetching data by device id:");
    }
  };
}

const dataController = new DataController(dataService);

export default dataController;
