interface RoomResponse {
  _id: string;
  name: string;
  backgroundName?: string;
  devices: DeviceResponse[];
}

interface RoomUpdateRequest{
  name: string;
  backgroundName?: string;
}