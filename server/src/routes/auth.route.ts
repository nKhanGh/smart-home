import { Router } from "express";
import authController from "../controllers/auth.controller";
import { verifyToken } from "../middleware/authMiddleware";
import {
  IntrospectSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
} from "../models/UserSchema";
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
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *                 example: khang123
 *               password:
 *                 type: string
 *                 example: 123456
 *               fullName:
 *                 type: string
 *                 example: Nguyen Huu Khang
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/register", validate(RegisterSchema), authController.register);

/**
 * @swagger
 * /api/auth/introspect:
 *   post:
 *     summary: Introspect token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6ImtoYW5nMTIzIiwicm9sZSI6ImFkbWluIiwidHlwZSI6ImFjY2VzcyJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *     responses:
 *       200:
 *         description: Token được introspect thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  "/introspect",
  validate(IntrospectSchema),
  authController.introspect,
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6ImtoYW5nMTIzIiwicm9sZSI6ImFkbWluIiwidHlwZSI6ImFjY2VzcyJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
 *     responses:
 *       200:
 *         description: Token được làm mới thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  "/refresh",
  validate(RefreshTokenSchema),
  authController.refreshToken,
);

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
router.post("/login", validate(LoginSchema), authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.post("/logout", verifyToken, authController.logout);

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
router.get("/me", verifyToken, authController.getMe);

export default router;
