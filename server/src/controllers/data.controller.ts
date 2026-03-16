import { Response } from "express";
import { AuthRequest } from "../types";
import dataService, {
  DataService,
  DataServiceError,
} from "../services/data.service";

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
      if (err instanceof DataServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching data list:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getDataById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDataById(req.params.id);
      res.status(200).json(data);
    } catch (err) {
      if (err instanceof DataServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching data detail:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
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
      if (err instanceof DataServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      console.error("Error fetching data by device id:", err);
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const dataController = new DataController(dataService);

export default dataController;
