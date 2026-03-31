import { Response }            from "express";
import { AuthRequest }          from "../types";
import { StatisticsService, Period } from "../services/statistic.service";

// GET /api/statistics/rooms
// Lấy danh sách phòng có sensor — dùng cho dropdown chọn phòng
export const getRoomsWithSensors = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await StatisticsService.getRoomsWithSensors();
    res.status(200).json(rooms);
  } catch (err: any) {
    res.status(err.code ?? 500).json({ code: err.code ?? "500", msg: err.message });
  }
};

// GET /api/statistics/rooms/:roomId/sensors
// Lấy danh sách sensor trong phòng — biết deviceId để gọi tiếp
export const getSensorsByRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sensors = await StatisticsService.getSensorsByRoom(req.params.roomId);
    res.status(200).json(sensors);
  } catch (err: any) {
    res.status(err.code ?? 500).json({ code: err.code ?? "500", msg: err.message });
  }
};

// GET /api/statistics/sensor/:deviceId?period=today|week|month
// Lấy thống kê 1 sensor — chart data + min/avg/max + currentValue
export const getSensorStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as Period) ?? "today";
    if (!["today", "week", "month"].includes(period)) {
      res.status(400).json({ code: "400", msg: "period phải là today | week | month" });
      return;
    }

    const stats = await StatisticsService.getSensorStats(req.params.deviceId, period);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(err.code ?? 500).json({ code: err.code ?? "500", msg: err.message });
  }
};

// GET /api/statistics/rooms/:roomId?period=today|week|month
// Lấy thống kê tất cả sensor trong 1 phòng — gọi 1 lần cho cả 3 card
export const getRoomStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as Period) ?? "today";
    if (!["today", "week", "month"].includes(period)) {
      res.status(400).json({ code: "400", msg: "period phải là today | week | month" });
      return;
    }

    const stats = await StatisticsService.getRoomStats(req.params.roomId, period);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(err.code ?? 500).json({ code: err.code ?? "500", msg: err.message });
  }
};