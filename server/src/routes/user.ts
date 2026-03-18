import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import validate from "../middleware/validateMiddleware";
import { AddUserSchema } from "../models/UserSchema";
import userController from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Thêm người dùng
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: khang123
 *               password:
 *                 type: string
 *                 example: 12345678
 *               fullName:
 *                 type: string
 *                 example: Nguyen Huu Khang
 *               role:
 *                 type: string
 *                 example: user
 *     responses:
 *       201:
 *         description: Thêm người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/", verifyToken, validate(AddUserSchema), userController.addUser);

export default router;
