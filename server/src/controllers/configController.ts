import { Response } from "express";
import { validationResult } from "express-validator";
import { SystemConfig } from "../models/SystemConfigSchema";
import mqttService from "../services/mqttService";
import { AuthRequest, SystemFeedKey } from "../types";

const CONFIG_TO_MQTT: Partial<Record<string, SystemFeedKey>> = {
  temp_alert_threshold: "sys.config.temp",
  light_mode          : "sys.config.light",
};

export const getAllConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json(await SystemConfig.find());
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await SystemConfig.findOne({ config_key: req.params.key });
    if (!config) { res.status(404).json({ code: "404", msg: "Config không tồn tại." }); return; }
    res.status(200).json(config);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const setConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." }); return;
  }
  const { config_value } = req.body;
  const key = req.params.key;
  try {
    const config = await SystemConfig.findOneAndUpdate(
      { config_key: key },
      { config_value },
      { new: true, upsert: true }
    );

    // Push config mới xuống Yolo:Bit qua MQTT ngay lập tức
    const mqttKey = CONFIG_TO_MQTT[key];
    if (mqttKey) mqttService.publishSystem(mqttKey, config_value);

    res.status(200).json({ code: "200", msg: "Cập nhật thành công.", config });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
