import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import sensorAlertController from "../controllers/sensorAlert.controller";

const router = Router();

/**
 * @swagger
 * /api/sensor-alerts:
 *   get:
 *     summary: Xem danh sách cảnh báo cảm biến
 *     description: Có thể lọc theo deviceId và giới hạn số bản ghi bằng limit
 *     tags: [SensorAlerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: false
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 100
 *     responses:
 *       200:
 *         description: Danh sách cảnh báo cảm biến
 *       400:
 *         description: deviceId không hợp lệ
 *       500:
 *         description: Server Error
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
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 100
 *     responses:
 *       200:
 *         description: Danh sách cảnh báo theo thiết bị
 *       400:
 *         description: deviceId không hợp lệ
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f9999
 *     responses:
 *       200:
 *         description: Chi tiết cảnh báo cảm biến
 *       404:
 *         description: SensorAlert not found
 *       500:
 *         description: Server Error
 */
router.get("/:id", verifyToken, sensorAlertController.getSensorAlertById);

export default router;
