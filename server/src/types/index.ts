import { Request } from "express";

// ─── Auth ───────────────────────────────────────────────────────
export interface JwtPayload {
  id    : string;
  username: string;
  role  : "admin" | "user";
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Device ─────────────────────────────────────────────────────
export interface IDataPoint {
  value     : string;
  created_at: Date;
}

export interface IDevice {
  device_id  : string;
  name       : string;
  key        : string;   // Adafruit feed key, VD: "phong-khach.den1"
  description: string;
  room       : string;   // Room ObjectId ref
  data       : IDataPoint[];
}

// ─── Room ────────────────────────────────────────────────────────
export interface IRoom {
  name   : string;
  key    : string;       // Adafruit group key, VD: "phong-khach"
  devices: string[];     // Device ObjectId refs
}

// ─── ActionLog ──────────────────────────────────────────────────
export interface IActionLog {
  user       : string;
  device     : string;
  device_name: string;
  action     : string;
  actor      : string;
  created_at : Date;
}

// ─── SystemConfig ───────────────────────────────────────────────
export interface ISystemConfig {
  config_key  : string;
  config_value: string;
}

// ─── MQTT ────────────────────────────────────────────────────────
export type SystemFeedKey =
  | "sys.config.temp"
  | "sys.config.light";

export const SYSTEM_FEEDS: Record<SystemFeedKey, string> = {
  "sys.config.temp" : "system.config.temp",
  "sys.config.light": "system.config.light-mode",
};

// ─── Adafruit ───────────────────────────────────────────────────
export interface AdafruitFeedResponse {
  id         : string;
  key        : string;
  name       : string;
  description: string;
  last_value : string;
}

export interface AdafruitDataPoint {
  value     : string;
  created_at: string;
}
