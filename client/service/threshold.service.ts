import axiosInstance from "@/utils/axios";

export const ThresholdService = {
  getThresholdDevices: (deviceId: string) => axiosInstance.get<ThresholdResponse[]>(`/devices/${deviceId}/threshold`),
  updateThreshold: (thresholdId: string, data: ThresholdRequest) => axiosInstance.put<ThresholdResponse>(`/thresholds/${thresholdId}`, data),
  createThreshold: (deviceId: string, data: ThresholdRequest) => axiosInstance.post<ThresholdResponse>(`/devices/${deviceId}/threshold`, data),
  deleteThreshold: (thresholdId: string) => axiosInstance.delete(`/thresholds/${thresholdId}`),
  switchThreshold: (thresholdId: string, active: boolean) => axiosInstance.patch(`/thresholds/${thresholdId}/active`, { active }),
}