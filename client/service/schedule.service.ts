import axiosInstance from "@/utils/axios";

export const ScheduleService = {
  getScheduleDevices: (deviceId: string) => axiosInstance.get<ScheduleResponse[]>(`/schedules/device/${deviceId}`),
  updateSchedule: (scheduleId: string, data: ScheduleRequest) => axiosInstance.put<ScheduleResponse>(`/schedules/${scheduleId}`, data),
  createSchedule: (data: ScheduleRequest) => axiosInstance.post<ScheduleResponse>(`/schedules`, data),
  deleteSchedule: (scheduleId: string) => axiosInstance.delete(`/schedules/${scheduleId}`),
  switchSchedule: (scheduleId: string) => axiosInstance.patch(`/schedules/${scheduleId}/switch`),
}