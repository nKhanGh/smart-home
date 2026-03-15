import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";
import { LoginSchema, RegisterSchema } from "../models/UserSchema";
import validate from "../middleware/validateMiddleware";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *             properties:
 *               username:
 *                 type: string
 *                 example: khang123
 *               password:
 *                 type: string
 *                 example: 123456
 *               full_name:
 *                 type: string
 *                 example: Nguyen Huu Khang
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/register", validate(RegisterSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: khangkhang
 *               password:
 *                 type: string
 *                 example: khangkhang
 *     responses:
 *       200:
 *         description: Trả về JWT token
 *       401:
 *         description: Sai username hoặc password
 */
router.post("/login", validate(LoginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.get("/me", verifyToken, getMe);

export default router;