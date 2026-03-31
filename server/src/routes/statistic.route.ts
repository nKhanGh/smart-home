import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getRoomsWithSensors,
  getSensorsByRoom,
  getSensorStats,
  getRoomStats,
} from "../controllers/statistic.controller";

const router = Router();

/**
 * @swagger
 * /api/statistics/rooms:
 *   get:
 *     summary: Lấy danh sách phòng có sensor
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng
 */
router.get("/rooms", verifyToken, getRoomsWithSensors);

/**
 * @swagger
 * /api/statistics/rooms/{roomId}/sensors:
 *   get:
 *     summary: Lấy danh sách sensor trong phòng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sensor (temperatureSensor, humiditySensor, lightSensor)
 */
router.get("/rooms/:roomId/sensors", verifyToken, getSensorsByRoom);

/**
 * @swagger
 * /api/statistics/rooms/{roomId}:
 *   get:
 *     summary: Lấy thống kê tất cả sensor trong phòng (gọi 1 lần cho cả 3 card)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: today
 *     responses:
 *       200:
 *         description: |
 *           Object chứa stats của từng sensor:
 *           { temperatureSensor: {...}, humiditySensor: {...}, lightSensor: {...} }
 */
router.get("/rooms/:roomId", verifyToken, getRoomStats);

/**
 * @swagger
 * /api/statistics/sensor/{deviceId}:
 *   get:
 *     summary: Lấy thống kê 1 sensor theo period
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: deviceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: today
 *     responses:
 *       200:
 *         description: Chart data + min/avg/max + currentValue
 */
router.get("/sensor/:deviceId", verifyToken, getSensorStats);

export default router;