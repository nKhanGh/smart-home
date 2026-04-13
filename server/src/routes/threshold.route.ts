import { Router } from "express";
import validate from "../middleware/validateMiddleware";
import { verifyToken } from "../middleware/authMiddleware";
import { CreateThresholdSchema } from "../models/ThresholdSchema";
import thresholdController from "../controllers/threshold.controller";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/devices/{id}/threshold:
 *   post:
 *     summary: Tạo ngưỡng cho thiết bị
 *     tags: [Thresholds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1e8e5d6c8f9a3b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *               - sensorId
 *               - when
 *               - action
 *             properties:
 *               sensorId:
 *                 type: string
 *                 example: 60c72b2f9b1e8e5d6c8f9a3c
 *               value:
 *                 type: number
 *                 example: 75
 *               when:
 *                 type: string
 *                 enum: [above, below]
 *                 example: above
 *               action:
 *                 type: string
 *                 enum: [on, off, alert]
 *                 example: alert
 *     responses:
 *       201:
 *         description: Tạo ngưỡng thành công
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.post(
  "/",
  verifyToken,
  validate(CreateThresholdSchema),
  thresholdController.createThreshold,
);

/**
 * @swagger
 * /api/devices/{id}/threshold:
 *   get:
 *     summary: Lấy danh sách ngưỡng của thiết bị
 *     tags: [Thresholds]
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
 *         description: Lấy danh sách ngưỡng thành công
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, thresholdController.getThreshold);

export default router;
