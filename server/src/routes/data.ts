import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import dataController from "../controllers/data.controller";

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
router.get("/", verifyToken, dataController.getDataList);

/**
 * @swagger
 * /api/data/device/{deviceId}:
 *   get:
 *     summary: Xem dữ liệu cảm biến theo id thiết bị
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 */
router.get("/device/:deviceId", verifyToken, dataController.getDataByDeviceId);

/**
 * @swagger
 * /api/data/{id}:
 *   get:
 *     summary: Xem chi tiết dữ liệu cảm biến
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", verifyToken, dataController.getDataById);

export default router;
