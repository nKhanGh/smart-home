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

interface MotionWatchScheduleRequest {
  deviceId: string
    active: boolean = true,
    repeatDays: string[],
    startTime: string,
    endTime: string,
    triggerCount: string = 3,
    countWindowMinutes: string = 5,
    minSignalIntervalSeconds: number = 8,
    cooldownMinutes: number = 10,
    createdAt: string,
}

interface MotionWatchScheduleResponse {
  _id: string;
  deviceId: ScheduleDevice;
  active: boolean;
  repeatDays: string[];
  startTime: string;
  endTime: string;
  triggerCount: string;
  countWindowMinutes: string;
  minSignalIntervalSeconds: number;
  cooldownMinutes: number;
  createdAt: string;
}
