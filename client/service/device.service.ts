import axiosInstance from "@/utils/axios";

export const DeviceService = {
  // getDevices: () => axiosInstance.get<Device[]>("/devices"),
  getSensorDevices: () => axiosInstance.get<DeviceResponse[]>("/devices/sensors"),
  // getDeviceById: (id: string) => axiosInstance.get<Device>(`/devices/${id}`),
  // updateDevice: (id: string, data: UpdateDeviceData) => axiosInstance.put(`/devices/${id}`, data),
  sendCommand: (deviceId: string, action: string, password?: string) => axiosInstance.post(`/devices/command/${deviceId}`, { action, password }),
  getCurrentData: (deviceId: string) => axiosInstance.get(`/devices/${deviceId}/current-data`),
}