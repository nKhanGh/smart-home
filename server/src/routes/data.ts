import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getDataByDeviceId,
  getDataById,
  getDataList,
} from "../controllers/dataController";

const router = Router();

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Xem danh sách dữ liệu cảm biến
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", verifyToken, getDataList);

/**
 * @swagger
 * /api/data/device/{deviceId}:
 *   get:
 *     summary: Xem dữ liệu cảm biến theo id thiết bị
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 */
router.get("/device/:deviceId", verifyToken, getDataByDeviceId);

/**
 * @swagger
 * /api/data/{id}:
 *   get:
 *     summary: Xem chi tiết dữ liệu cảm biến
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", verifyToken, getDataById);

export default router;
