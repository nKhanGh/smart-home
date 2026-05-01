interface DeviceResponse {
  id: string;
  name: string;
  key: string;
  description: string;
  mode: string;
  roomId: {
    _id: string;
    name: string;
  };
  type: string;
  createdAt: string;
  updatedAt: string;
  currentData?: string | number;
  currentAction?: string | number;
  threshold?: string | number;
}

interface QuickDevice {
  name: string;
  roomName: string;
  roomId: string;
  type: string;
  currentAction: string | number;
}

interface CommandInput {
  action: string;
  password?: string;
}

interface DeviceVoiceCommandResponse {
  code: string;
  msg: string;
  parsed: DeviceVoiceCommandParsed;
}

interface DeviceVoiceCommandParsed {
  deviceName: string;
  action: string;
  rawText: string;
  roomName: string;
}

interface DeviceHistoryQuery {
  page?: number;
  size?: number;
  startDate?: string;
  endDate?: string;
}

interface PaginatedResponse<T> {
  currentPage: number;
  size: number;
  totalPage: number;
  totalElement: number;
  items: T[];
}

interface DeviceActionLogItem {
  _id: string;
  userId?: string;
  deviceId: string;
  action: string;
  actor: string;
  createdAt: string;
}

interface DeviceDataLogItem {
  _id: string;
  deviceId: string;
  value: string;
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DeviceActionLogResponse extends PaginatedResponse<DeviceActionLogItem> {}

interface DeviceDataLogResponse extends PaginatedResponse<DeviceDataLogItem> {
  max: number | null;
  min: number | null;
  average: number | null;
}