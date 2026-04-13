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