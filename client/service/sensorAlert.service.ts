import axiosInstance from "@/utils/axios";

export const SensorAlertService = {
  getAlerts: (
    deviceId: string,
    page: number,
    size: number,
    startDate?: string,
    endDate?: string,
  ) =>
    axiosInstance.get<SensorAlertPage>(`/sensor-alerts/device/${deviceId}`, {
      params: {
        page,
        size,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      },
    }),
};
