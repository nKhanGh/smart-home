import { Router } from "express";
import homeDisplayController from "../controllers/homeDisplay.controller";
import { verifyToken } from "../middleware/authMiddleware";
import validate from "../middleware/validateMiddleware";
import { CreateHomeDisplaySchema, UpdateHomeDisplaySchema } from "../models/HomeDisplaySchema";

/**
 * @swagger
 * tags:
 *   name: HomeDisplay
 *   description: API quản lý hiển thị trên trang chủ
 */
const router = Router();


/** * @swagger
 * /api/home-display:
 *   post:
 *     summary: Tạo cấu hình hiển thị trang chủ cho người dùng
 *     tags: [HomeDisplay]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - tempId
 *               - briId
 *               - humId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *               tempId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               briId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cc
 *               humId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cd
 *               instantControl:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Cấu hình hiển thị trang chủ được tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc người dùng đã có cấu hình hiển thị
 *       500:
 *         description: Server Error
 */
router.post("/", verifyToken, validate(CreateHomeDisplaySchema), homeDisplayController.createHomeDisplay);

/**
 * @swagger
 * /api/home-display:
 *   get:
 *     summary: Lấy cấu hình hiển thị trang chủ của người dùng
 *     tags: [HomeDisplay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cấu hình hiển thị trang chủ của người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109ca
 *                 tempId:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109cb
 *                 briId:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109cc
 *                 humId:
 *                   type: string
 *                   example: 60d0fe4f5311236168a109cd
 *                 instantControl:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Không tìm thấy cấu hình hiển thị cho người dùng
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, homeDisplayController.getHomeDisplay);

/**
 * @swagger
 * /api/home-display:
 *   put:
 *     summary: Cập nhật cấu hình hiển thị trang chủ của người dùng
 *     tags: [HomeDisplay]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cb
 *               briId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cc
 *               humId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cd
 *               instantControl:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cấu hình hiển thị trang chủ được cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy cấu hình hiển thị cho người dùng
 *       500:
 *         description: Server Error
 */
router.put("/", verifyToken, validate(UpdateHomeDisplaySchema), homeDisplayController.updateHomeDisplay);

export default router;