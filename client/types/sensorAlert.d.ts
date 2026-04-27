interface SensorAlertResponse {
  _id: string;
  deviceId: SensorAlertDevice;
  value: string;
  threshold: number;
  createdAt: string;
  updatedAt: string;
}

interface SensorAlertDevice {
  _id: string;
  name: string;
  key: string;
  type: string;
};


interface SensorAlertPage {
  totalPage: number;
  totalElement: number;
  currentPage: number;
  size: number;
  items: SensorAlertResponse[];
  max: number;
  min: number;
  average: number;
}