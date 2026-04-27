import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import sensorAlertController from "../controllers/sensorAlert.controller";

const router = Router();

/**
 * @swagger
 * /api/sensor-alerts:
 *   get:
 *     summary: Xem danh sách cảnh báo cảm biến
 *     description: Có thể lọc theo deviceId và phân trang bằng page, size
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
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Kết quả phân trang gồm totalPage, totalElement và listSensorAlert
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
 *     description: Hỗ trợ phân trang bằng page, size và lọc theo khoảng thời gian createdAt
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
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-04-01T00:00:00.000Z
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *           example: 2026-04-30T23:59:59.999Z
 *     responses:
 *       200:
 *         description: Kết quả phân trang gồm totalPage, totalElement và listSensorAlert
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
