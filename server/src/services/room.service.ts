import Room, { AddRoomInput } from "../models/RoomSchema";
import { ServiceError } from "../errors/service.error";

export class RoomService {
  // private removeVietnameseTones(str: string) {
  //   return str
  //     .normalize("NFD")
  //     .replace(/[\u0300-\u036f]/g, "")
  //     .replace(/đ/g, "d")
  //     .replace(/Đ/g, "D");
  // }

  // buildRoomKey(name: string) {
  //   return this.removeVietnameseTones(name)
  //     .toLowerCase()
  //     .trim()
  //     .replace(/\s+/g, "-");
  // }

  async getRooms() {
    return Room.find().populate("devices", "name device_id key description mode type");
  }

  async getRoomById(id: string) {
    const room = await Room.findById(id).populate(
      "devices",
      "name device_id key description mode type",
    );
    if (!room) {
      throw new ServiceError(404, "Room not found.");
    }
    return room;
  }

  async updateRoom(id: string, payload: Partial<AddRoomInput>) {
    const room = await Room.findById(id);
    if (!room) {
      throw new ServiceError(404, "Room not found.");
    }
    if (payload.name && payload.name !== room.name) {
      room.name = payload.name;
      room.backgroundName = payload.backgroundName || room.backgroundName;
    }
    await room.save();
    return room;
  }


  // async addRoom(payload: AddRoomInput, createdBy?: string) {
  //   const key = this.buildRoomKey(payload.name);

  //   if (await Room.findOne({ key })) {
  //     throw new ServiceError(400, "Key phòng đã tồn tại.");
  //   }

  //   const room = await Room.create({
  //     name: payload.name,
  //     key,
  //     backgroundName: payload.backgroundName,
  //     createdBy,
  //   });

  //   return { room, key };
  // }

  // async deleteRoom(id: string) {
  //   const room = await Room.findByIdAndDelete(id);
  //   if (!room) {
  //     throw new ServiceError(404, "Room not found.");
  //   }
  //   return room;
  // }
}

const roomService = new RoomService();

export default roomService;
