interface ThresholdResponse {
  _id: string;
  deviceId: string;
  sensor: ThresholdSensorResponse;
  active: boolean;
  value: 50;
  when: "above" | "below";
  action: "alert" | "on" | "off";
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ThresholdSensorResponse {
  _id: string;
  name: string;
  type: string;
  roomName: string;
}

interface ThresholdRequest {
  sensorId: string;
  value: number;
  action: ActionType;
  when: WhenType;
}

type ActionType = "on" | "off" | "alert";
type WhenType = "above" | "below";