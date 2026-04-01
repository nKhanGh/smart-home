import axiosInstance from "@/utils/axios";

type Period = "today" | "week" | "month";

export const StatisticService = {
  getRoomsWithSensors: () =>
    axiosInstance.get<RoomWithSensors[]>("/statistics/rooms"),

  getSensorsByRoom: (roomId: string) =>
    axiosInstance.get<SensorInRoom[]>(`/statistics/rooms/${roomId}/sensors`),

  getSensorStats: (deviceId: string, period: Period) =>
    axiosInstance.get<SensorStatResponse>(
      `/statistics/sensor/${deviceId}?period=${period}`
    ),
};
