import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import { getRooms, addRoom, deleteRoom } from "../controllers/roomController";

const router = Router();

router.get("/",       verifyToken, getRooms);
router.post("/",      verifyToken, [
  check("name", "Tên phòng không được trống").notEmpty(),
  check("key",  "Key phòng không được trống").notEmpty(),
], addRoom);
router.delete("/:id", verifyToken, deleteRoom);

export default router;
