import axiosInstance from "@/utils/axios";

export const DeviceService = {
  getAll: () => axiosInstance.get<DeviceResponse[]>("/devices"),
  getSensorDevices: () => axiosInstance.get<DeviceResponse[]>("/devices/sensors"),
  getDeviceById: (id: string) => axiosInstance.get<DeviceResponse>(`/devices/${id}`),
  // updateDevice: (id: string, data: UpdateDeviceData) => axiosInstance.put(`/devices/${id}`, data),
  sendCommand: (deviceId: string, action: string, password?: string) => axiosInstance.post(`/devices/command/${deviceId}`, { action, password }),
  getCurrentData: (deviceId: string) => axiosInstance.get(`/devices/${deviceId}/current-data`),
  getCurrentAction: (deviceId: string) => axiosInstance.get(`/devices/${deviceId}/current-action`),
  getDeviceDataLogs: (deviceId: string, query?: DeviceHistoryQuery) =>
    axiosInstance.get<DeviceDataLogItem[]>(`/devices/${deviceId}/data`, {
      params: query,
    }),
  getDeviceLogs: (deviceId: string, query?: DeviceHistoryQuery) =>
    axiosInstance.get<DeviceActionLogItem[]>(`/devices/${deviceId}/logs`, {
      params: query,
    }),
  getThresholdDevices: () => axiosInstance.get<DeviceResponse[]>("/devices/threshold"),
  updateThreshold: (deviceId: string, threshold: number) => axiosInstance.put(`/devices/${deviceId}`, { threshold }),
  sendVoidCommand: (text: string) => axiosInstance.post<DeviceVoiceCommandResponse>(`/devices/voice-command`, { text }),
}