import axiosInstance from "@/utils/axios";

export const ScheduleService = {
  getScheduleDevices: (deviceId: string) => axiosInstance.get<ScheduleResponse[]>(`/schedules/device/${deviceId}`),
  updateSchedule: (scheduleId: string, data: ScheduleRequest) => axiosInstance.put<ScheduleResponse>(`/schedules/${scheduleId}`, data),
  createSchedule: (data: ScheduleRequest) => axiosInstance.post<ScheduleResponse>(`/schedules/device-actions`, data),
  deleteSchedule: (scheduleId: string) => axiosInstance.delete(`/schedules/${scheduleId}`),
  switchSchedule: (scheduleId: string) => axiosInstance.patch(`/schedules/${scheduleId}/switch`),
  createMotionWatchSchedule: (payload: MotionWatchScheduleRequest) => axiosInstance.post("/schedules/motion-watch", payload),
  getMotionWatchSchedules: (deviceId: string) => axiosInstance.get(`/schedules/motion-watch?deviceId=${deviceId}`),
  updateMotionWatchSchedule: (id: string, payload: MotionWatchScheduleRequest) => axiosInstance.patch(`/schedules/motion-watch/${id}`, payload),
  deleteMotionWatchSchedule: (id: string) => axiosInstance.delete(`/schedules/motion-watch/${id}`),
}