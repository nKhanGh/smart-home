interface UpdateHomeDisplayData {
  tempId?: string;
  briId?: string;
  humId?: string;
  instantControl?: string[] = [];
}

interface TempDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "temperatureSensor";
}

interface BriDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "lightSensor";
}

interface HumDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "humiditySensor";
}

interface DeviceInstantControl {
  deviceId: string;
  roomName: string;
  roomId: string;
  type: "device";
  currentAction: string | number;
}

interface HomeDisplayResponse {
  userId: string;
  temp: TempDisplay;
  bri: BriDisplay;
  hum: HumDisplay;
  instantControl: DeviceInstantControl[];
}