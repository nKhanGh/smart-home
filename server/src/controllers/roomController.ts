import { Response } from "express";
import { validationResult } from "express-validator";
import Room, { AddRoomInput } from "../models/RoomSchema";
import { AuthRequest } from "../types";
import { adafruitAPI } from "../adafruit";

export const getRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find().populate("devices", "name device_id key description");
    res.status(200).json(rooms);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD") // tách ký tự + dấu
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const addRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, backgroundName } = req.body as AddRoomInput;
  const key = removeVietnameseTones(name).toLowerCase().trim().replace(/\s+/g, "-");
  try {
    if (await Room.findOne({ key })) {
      res.status(400).json({ code: "400", msg: "Key phòng đã tồn tại." }); return;
    }

    console.log(`[Creating Room] Name: ${name}, Key: ${key}, CreatedBy: ${req.user?.id}`);

    await adafruitAPI.post("/groups", { group: { name, key } });
    console.log(`[Adafruit] Group created: ${name} (Key: ${key})`);
    const room = await Room.create({ name, key, backgroundName, createdBy: req.user?.id });
    console.log(`[Room Created] ${room.name} (ID: ${room._id}) by User ID: ${req.user?.id}`);
    res.status(201).json({ code: "201", msg: "Thêm phòng thành công.", room });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) { res.status(404).json({ code: "404", msg: "Room not found." }); return; }
    await adafruitAPI.delete(`/groups/${room.key}`);
    res.status(200).json({ code: "200", msg: "Xóa phòng thành công." });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
