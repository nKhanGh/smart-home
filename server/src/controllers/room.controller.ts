import { Response } from "express";
import { AuthRequest } from "../types";
import roomService, { RoomService } from "../services/room.service";
import { adafruitAPI } from "../adafruit";
import { AddRoomInput } from "../models/RoomSchema";
import handleControllerError from "../utils/handleControllerError";

export class RoomController {
  constructor(private readonly service: RoomService) {}

  getRooms = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rooms = await this.service.getRooms();
      res.status(200).json(rooms);
    } catch (err) {
      handleControllerError(err, res, "Error fetching rooms:");
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
      handleControllerError(err, res, "Error creating room:");
    }
  };

  deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const room = await this.service.deleteRoom(req.params.id);
      await adafruitAPI.delete(`/groups/${room.key}`);
      res.status(200).json({ code: "200", msg: "Xóa phòng thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error deleting room:");
    }
  };
}

const roomController = new RoomController(roomService);

export default roomController;
