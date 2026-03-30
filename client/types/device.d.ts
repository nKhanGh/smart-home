interface DeviceResponse {
  _id: string;
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
}