import { Router } from "express";
import validate from "../middleware/validateMiddleware";
import { verifyToken } from "../middleware/authMiddleware";
import {
  SetThresholdActiveSchema,
  UpdateThresholdSchema,
} from "../models/ThresholdSchema";
import thresholdController from "../controllers/threshold.controller";

const router = Router();

/**
 * @swagger
 * /api/thresholds/{thresholdId}:
 *   put:
 *     summary: Cập nhật ngưỡng theo thresholdId
 *     tags: [Thresholds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: thresholdId
 *         required: true
 *         schema:
 *           type: string
 *           example: 67f2c1d9e8c1a32b1a6f0001
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
 *       200:
 *         description: Cập nhật ngưỡng thành công
 *       404:
 *         description: Threshold/Device/Sensor not found
 *       500:
 *         description: Server Error
 */
router.put(
  "/:thresholdId",
  verifyToken,
  validate(UpdateThresholdSchema),
  thresholdController.updateThreshold,
);

/**
 * @swagger
 * /api/thresholds/{thresholdId}:
 *   delete:
 *     summary: Xóa ngưỡng theo thresholdId
 *     tags: [Thresholds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: thresholdId
 *         required: true
 *         schema:
 *           type: string
 *           example: 67f2c1d9e8c1a32b1a6f0001
 *     responses:
 *       200:
 *         description: Xóa ngưỡng thành công
 *       404:
 *         description: Threshold not found
 *       500:
 *         description: Server Error
 */
router.delete(
  "/:thresholdId",
  verifyToken,
  thresholdController.deleteThreshold,
);

/**
 * @swagger
 * /api/thresholds/{thresholdId}/active:
 *   patch:
 *     summary: Bật/tắt threshold theo thresholdId
 *     tags: [Thresholds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: thresholdId
 *         required: true
 *         schema:
 *           type: string
 *           example: 67f2c1d9e8c1a32b1a6f0001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - active
 *             properties:
 *               active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái active thành công
 *       404:
 *         description: Threshold not found
 *       500:
 *         description: Server Error
 */
router.patch(
  "/:thresholdId/active",
  verifyToken,
  validate(SetThresholdActiveSchema),
  thresholdController.setThresholdActive,
);

export default router;
