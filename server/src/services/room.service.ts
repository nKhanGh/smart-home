import Room, { AddRoomInput } from "../models/RoomSchema";

export class RoomServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class RoomService {
  private removeVietnameseTones(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  buildRoomKey(name: string) {
    return this.removeVietnameseTones(name)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
  }

  async getRooms() {
    return Room.find().populate("devices", "name device_id key description");
  }

  async addRoom(payload: AddRoomInput, createdBy?: string) {
    const key = this.buildRoomKey(payload.name);

    if (await Room.findOne({ key })) {
      throw new RoomServiceError(400, "Key phòng đã tồn tại.");
    }

    const room = await Room.create({
      name: payload.name,
      key,
      backgroundName: payload.backgroundName,
      createdBy,
    });

    return { room, key };
  }

  async deleteRoom(id: string) {
    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      throw new RoomServiceError(404, "Room not found.");
    }
    return room;
  }
}

const roomService = new RoomService();

export default roomService;
