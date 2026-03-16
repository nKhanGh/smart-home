import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import sensorAlertController from "../controllers/sensorAlert.controller";

const router = Router();

/**
 * @swagger
 * /api/sensor-alerts:
 *   get:
 *     summary: Xem danh sách cảnh báo cảm biến
 *     tags: [SensorAlerts]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", verifyToken, sensorAlertController.getSensorAlerts);

/**
 * @swagger
 * /api/sensor-alerts/device/{deviceId}:
 *   get:
 *     summary: Xem cảnh báo cảm biến theo id thiết bị
 *     tags: [SensorAlerts]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/device/:deviceId",
  verifyToken,
  sensorAlertController.getSensorAlertsByDeviceId,
);

/**
 * @swagger
 * /api/sensor-alerts/{id}:
 *   get:
 *     summary: Xem chi tiết cảnh báo cảm biến
 *     tags: [SensorAlerts]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", verifyToken, sensorAlertController.getSensorAlertById);

export default router;
