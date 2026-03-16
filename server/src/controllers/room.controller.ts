import { Response } from "express";
import { AuthRequest } from "../types";
import roomService, {
  RoomService,
  RoomServiceError,
} from "../services/room.service";
import { adafruitAPI } from "../adafruit";
import { AddRoomInput } from "../models/RoomSchema";

export class RoomController {
  constructor(private readonly service: RoomService) {}

  getRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rooms = await this.service.getRooms();
      res.status(200).json(rooms);
    } catch {
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  addRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const payload = req.body as AddRoomInput;
      const { room, key } = await this.service.addRoom(payload, req.user?.id);
      await adafruitAPI.post("/groups", { group: { name: payload.name, key } });
      res
        .status(201)
        .json({ code: "201", msg: "Thêm phòng thành công.", room });
    } catch (err) {
      if (err instanceof RoomServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const room = await this.service.deleteRoom(req.params.id);
      await adafruitAPI.delete(`/groups/${room.key}`);
      res.status(200).json({ code: "200", msg: "Xóa phòng thành công." });
    } catch (err) {
      if (err instanceof RoomServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const roomController = new RoomController(roomService);

export default roomController;
