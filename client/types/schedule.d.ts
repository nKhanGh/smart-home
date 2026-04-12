interface ScheduleResponse {
  _id: string;
  deviceId: ScheduleDevice;
  triggerTime: string;
  action: "off" | "on";
  active: boolean;
  repeatDays: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScheduleDevice {
  _id: string;
  name: string;
  key: string;
  type: string;
}

interface ScheduleRequest {
  deviceId: string;
  triggerTime: string;
  action: "off" | "on";
  repeatDays: string[];
}
