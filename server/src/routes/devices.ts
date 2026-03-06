import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getDevices, getDeviceById, getDeviceData,
  addDevice, updateDevice, deleteDevice,
  sendCommand, getLogs,
} from "../controllers/deviceController";

const router = Router();

const addRules = [
  check("device_id",  "device_id không được trống").notEmpty(),
  check("name",       "name không được trống").notEmpty(),
  check("room_name",  "room_name không được trống").notEmpty(),
];

router.get("/",                  verifyToken, getDevices);
router.get("/:id",               verifyToken, getDeviceById);
router.get("/:id/data",          verifyToken, getDeviceData);
router.get("/:id/logs",          verifyToken, getLogs);
router.post("/",                 verifyToken, addRules, addDevice);
router.put("/:id",               verifyToken, updateDevice);
router.delete("/:id",            verifyToken, deleteDevice);
router.post("/command",          verifyToken, sendCommand);

export default router;
