/**
 * services/statistics.service.ts
 *
 * Cung cấp dữ liệu thống kê cho màn hình Thống kê:
 * - Chart data (giá trị theo thời gian)
 * - Min / Avg / Max
 * - Giá trị hiện tại
 */
import Data  from "../models/DataSchema";
import Device from "../models/DeviceSchema";
import Room   from "../models/RoomSchema";
import { ServiceError } from "../errors/service.error";

export type Period = "today" | "week" | "month";

// ── Tính khoảng thời gian từ period ──────────────────────────────
const getDateRange = (period: Period): { from: Date; to: Date } => {
  const to   = new Date();
  const from = new Date();

  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }

  return { from, to };
};

// ── Format label trục X theo period ──────────────────────────────
const formatLabel = (date: Date, period: Period): string => {
  if (period === "today") {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  if (period === "week") {
    return date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit" });
  }
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

// ── Group data thành các điểm trên chart ─────────────────────────
// today  → group theo giờ (24 điểm)
// week   → group theo ngày (7 điểm)
// month  → group theo ngày (30 điểm)
const groupDataPoints = (
  rawData: { value: string; recordedAt: Date }[],
  period : Period,
): { label: string; value: number }[] => {
  const map = new Map<string, number[]>();

  rawData.forEach(({ value, recordedAt }) => {
    let key: string;
    if (period === "today") {
      key = `${recordedAt.getHours()}:00`;
    } else {
      key = recordedAt.toLocaleDateString("vi-VN");
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(parseFloat(value));
  });

  return Array.from(map.entries()).map(([label, values]) => ({
    label,
    value: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
  }));
};

// ── Service methods ───────────────────────────────────────────────
export const StatisticsService = {

  /**
   * Lấy danh sách sensor devices theo roomId
   * Dùng để populate dropdown phòng trên màn hình thống kê
   */
  async getSensorsByRoom(roomId: string) {
    const room = await Room.findById(roomId);
    if (!room) throw new ServiceError(404, "Room not found.");

    const sensors = await Device.find({
      roomId,
      type: { $in: ["temperatureSensor", "humiditySensor", "lightSensor"] },
    }).select("_id name type roomId");

    return sensors;
  },

  /**
   * Lấy tất cả phòng có sensor
   */
  async getRoomsWithSensors() {
    const sensorDevices = await Device.find({
      type: { $in: ["temperatureSensor", "humiditySensor", "lightSensor"] },
    }).populate("roomId", "name key").select("roomId");

    // Extract unique rooms
    const roomMap = new Map<string, { _id: string; name: string; key: string }>();
    sensorDevices.forEach((d: any) => {
      if (d.roomId?._id) {
        roomMap.set(d.roomId._id.toString(), {
          _id : d.roomId._id.toString(),
          name: d.roomId.name,
          key : d.roomId.key,
        });
      }
    });

    return Array.from(roomMap.values());
  },

  /**
   * Lấy thống kê của 1 sensor theo period
   * Trả về: chartData, min, avg, max, currentValue, unit
   */
  async getSensorStats(deviceId: string, period: Period) {
    const device = await Device.findById(deviceId);
    if (!device) throw new ServiceError(404, "Device not found.");
    if (!["temperatureSensor", "humiditySensor", "lightSensor"].includes(device.type)) {
      throw new ServiceError(400, "Device không phải sensor.");
    }

    const { from, to } = getDateRange(period);

    const rawData = await Data.find({
      deviceId,
      recordedAt: { $gte: from, $lte: to },
    })
      .sort({ recordedAt: 1 })
      .select("value recordedAt");

    if (rawData.length === 0) {
      return {
        deviceId,
        deviceName  : device.name,
        type        : device.type,
        period,
        currentValue: null,
        chartData   : [],
        stats       : { min: null, avg: null, max: null },
        unit        : getUnit(device.type),
      };
    }

    const values    = rawData.map((d) => parseFloat(d.value));
    const min       = parseFloat(Math.min(...values).toFixed(1));
    const max       = parseFloat(Math.max(...values).toFixed(1));
    const avg       = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
    const chartData = groupDataPoints(rawData as any, period);

    // Giá trị mới nhất
    const latest = rawData[rawData.length - 1];

    return {
      deviceId,
      deviceName  : device.name,
      type        : device.type,
      period,
      currentValue: parseFloat(latest.value),
      chartData,
      stats       : { min, avg, max },
      unit        : getUnit(device.type),
    };
  },

  /**
   * Lấy thống kê tất cả sensor trong 1 phòng theo period
   * Gọi 1 lần để lấy data cho cả 3 card (nhiệt độ, độ ẩm, ánh sáng)
   */
  async getRoomStats(roomId: string, period: Period) {
    const sensors = await Device.find({
      roomId,
      type: { $in: ["temperatureSensor", "humiditySensor", "lightSensor"] },
    }).select("_id type name");

    const results = await Promise.all(
      sensors.map((s) => StatisticsService.getSensorStats(s._id.toString(), period))
    );

    // Trả về object key theo type
    const output: Record<string, any> = {};
    results.forEach((r) => { output[r.type] = r; });
    return output;
  },
};

const getUnit = (type: string): string => {
  if (type === "temperatureSensor") return "°C";
  if (type === "humiditySensor")    return "%";
  if (type === "lightSensor")       return "lux";
  return "";
};