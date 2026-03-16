import { Response } from "express";
import { AuthRequest } from "../types";
import {
  DataServiceError,
  getDataByDeviceId as getDataByDeviceIdService,
  getDataById as getDataByIdService,
  getDataList as getDataListService,
} from "../services/dataService";

export const getDataList = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await getDataListService(
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

export const getDataById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await getDataByIdService(req.params.id);

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

export const getDataByDeviceId = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await getDataByDeviceIdService(
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
