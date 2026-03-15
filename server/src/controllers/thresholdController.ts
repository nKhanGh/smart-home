import { AuthRequest } from "../types";
import { Response } from "express";
import Threshold, { UpdateThresholdInput } from "../models/ThresholdSchema";
import Device from "../models/DeviceSchema";

export const getThreshold = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ _id: req.params.id });
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }
    const threshold = await Threshold.findOne({ deviceId: device._id });
    if (!threshold) {
      res.status(404).json({ code: "404", msg: "Threshold not found." });
      return;
    }
    res.status(200).json(threshold);
  } catch (err) {
    console.error("Error fetching threshold:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
}

export const updateThreshold = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const device = await Device.findOne({ _id: req.params.id });
    console.log(`[Update Threshold] Device ID: ${req.params.id}, User ID: ${req.user?.id}`);
    if (!device) {
      res.status(404).json({ code: "404", msg: "Device not found." });
      return;
    }
    const { value } = req.body as UpdateThresholdInput;
    let threshold = await Threshold.findOne({ deviceId: device._id });
    if (threshold) {
      threshold.value = value;
      threshold.updatedAt = new Date();
      threshold.updatedBy = req.user?.id || "unknown";
      await threshold.save();
    } else {
      threshold = await Threshold.create({
        deviceId: device._id,
        value,
      });
    }
    res.status(200).json(threshold);
  } catch (err) {
    console.error("Error updating threshold:", err);
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
}