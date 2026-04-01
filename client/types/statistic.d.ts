interface ChartDataPoint {
  label: string;
  value: number;
}

interface SensorStats {
  min: number;
  avg: number;
  max: number;
}

interface SensorStatResponse {
  deviceId: string;
  deviceName: string;
  type: "temperatureSensor" | "humiditySensor" | "lightSensor";
  period: "today" | "week" | "month";
  currentValue: number;
  chartData: ChartDataPoint[];
  stats: SensorStats;
  unit: string;
}

interface RoomWithSensors {
  _id: string;
  name: string;
}

interface SensorInRoom {
  _id: string;
  name: string;
  type: "temperatureSensor" | "humiditySensor" | "lightSensor";
}
