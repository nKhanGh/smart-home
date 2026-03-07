import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import { getAllConfig, getConfig, setConfig } from "../controllers/configController";

const router = Router();

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Lấy toàn bộ system config
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách config hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   config_key:
 *                     type: string
 *                     example: temp_alert_threshold
 *                   config_value:
 *                     type: string
 *                     example: "35"
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, getAllConfig);

/**
 * @swagger
 * /api/config/{key}:
 *   get:
 *     summary: Lấy config theo key
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Key của config
 *         schema:
 *           type: string
 *           example: temp_alert_threshold
 *     responses:
 *       200:
 *         description: Thông tin config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 config_key:
 *                   type: string
 *                 config_value:
 *                   type: string
 *       404:
 *         description: Config không tồn tại
 *       500:
 *         description: Server Error
 */
router.get("/:key", verifyToken, getConfig);

/**
 * @swagger
 * /api/config/{key}:
 *   put:
 *     summary: Cập nhật config hệ thống
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Key của config
 *         schema:
 *           type: string
 *           example: temp_alert_threshold
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config_value
 *             properties:
 *               config_value:
 *                 type: string
 *                 example: "30"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "200"
 *                 msg:
 *                   type: string
 *                   example: Cập nhật thành công.
 *                 config:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Server Error
 */
router.put("/:key",
  verifyToken,
  [
    check("config_value", "config_value không được trống").notEmpty(),
  ],
  setConfig
);

export default router;