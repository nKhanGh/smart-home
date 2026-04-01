import axiosInstance from "@/utils/axios";

export type StatisticPeriod = "today" | "week" | "month";

export interface SensorChartPoint {
  label: string;
  value: number;
}

export interface SensorStatisticResponse {
  deviceId: string;
  deviceName: string;
  type: "temperatureSensor" | "humiditySensor" | "lightSensor";
  period: StatisticPeriod;
  currentValue: number | null;
  chartData: SensorChartPoint[];
  stats: {
    min: number | null;
    avg: number | null;
    max: number | null;
  };
  unit: string;
}

export const StatisticService = {
  getSensorStats: (deviceId: string, period: StatisticPeriod) =>
    axiosInstance.get<SensorStatisticResponse>(`/statistics/sensor/${deviceId}`, {
      params: { period },
    }),
};
