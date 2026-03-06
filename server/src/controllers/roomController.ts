import { Response } from "express";
import { validationResult } from "express-validator";
import Room from "../models/RoomSchema";
import { AuthRequest } from "../types";

export const getRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find().populate("devices", "name device_id key description");
    res.status(200).json(rooms);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const addRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." }); return;
  }
  const { name, key } = req.body;
  try {
    if (await Room.findOne({ key })) {
      res.status(400).json({ code: "400", msg: "Key phòng đã tồn tại." }); return;
    }
    const room = await Room.create({ name, key });
    res.status(201).json({ code: "201", msg: "Thêm phòng thành công.", room });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) { res.status(404).json({ code: "404", msg: "Room not found." }); return; }
    res.status(200).json({ code: "200", msg: "Xóa phòng thành công." });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
