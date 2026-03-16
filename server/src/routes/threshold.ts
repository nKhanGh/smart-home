import { Router } from "express";
import validate from "../middleware/validateMiddleware";
import { verifyToken } from "../middleware/authMiddleware";
import { UpdateThresholdSchema } from "../models/ThresholdSchema";
import thresholdController from "../controllers/threshold.controller";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/devices/{id}/threshold:
 *   put:
 *     summary: Cập nhật ngưỡng
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
 *             properties:
 *               value:
 *                 type: number
 *                 example: 75
 *     responses:
 *       200:
 *         description: Cập nhật ngưỡng thành công
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.put(
  "",
  verifyToken,
  validate(UpdateThresholdSchema),
  thresholdController.updateThreshold,
);

/**
 * @swagger
 * /api/devices/{id}/threshold:
 *   get:
 *     summary: Lấy ngưỡng
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
 *         description: Lấy ngưỡng thành công
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.get("", verifyToken, thresholdController.getThreshold);

export default router;
