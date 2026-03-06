import { Router } from "express";
import { check } from "express-validator";
import { register, login, getMe } from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", [
  check("username",  "Username tối thiểu 3 ký tự").isLength({ min: 3 }),
  check("password",  "Password tối thiểu 6 ký tự").isLength({ min: 6 }),
  check("full_name", "Họ tên không được trống").notEmpty(),
], register);

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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về JWT token
 */
router.post("/login", [
  check("username", "Username không được trống").notEmpty(),
  check("password", "Password không được trống").notEmpty(),
], login);

router.get("/me", verifyToken, getMe);

export default router;
