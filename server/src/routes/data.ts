import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import dataController from "../controllers/data.controller";

const router = Router();

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Xem danh sách dữ liệu cảm biến
 *     description: Có thể lọc theo deviceId, type và giới hạn số bản ghi bằng limit
 *     tags: [Data]
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
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [tempSensor, lightSensor, humiditySensor]
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 200
 *     responses:
 *       200:
 *         description: Danh sách dữ liệu
 *       400:
 *         description: deviceId không hợp lệ
 *       500:
 *         description: Server Error
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
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8e5d6c8f9a3b
 *     responses:
 *       200:
 *         description: Danh sách dữ liệu cảm biến của thiết bị
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   deviceId:
 *                     type: string
 *                   type:
 *                     type: string
 *                     example: tempSensor
 *                   value:
 *                     oneOf:
 *                       - type: number
 *                       - type: string
 *                       - type: boolean
 *                   recordedAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: deviceId không hợp lệ
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8e5d6c8f9a3b
 *     responses:
 *       200:
 *         description: Chi tiết dữ liệu cảm biến
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 deviceId:
 *                   type: string
 *                 type:
 *                   type: string
 *                   example: tempSensor
 *                 value:
 *                   oneOf:
 *                     - type: number
 *                     - type: string
 *                     - type: boolean
 *                 recordedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Data not found
 *       500:
 *         description: Server Error
 */
router.get("/:id", verifyToken, dataController.getDataById);

export default router;
