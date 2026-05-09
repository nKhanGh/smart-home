import { Router } from "express";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware";
import validate from "../middleware/validateMiddleware";
import {
  AddUserSchema,
  ChangePasswordSchema,
  PushTokenSchema,
  UpdateProfileSchema,
} from "../models/UserSchema";
import userController from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Thêm người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [admin, user]
 *                 example: user
 *     responses:
 *       201:
 *         description: Thêm người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "201"
 *                 msg:
 *                   type: string
 *                   example: Thêm người dùng thành công.
 *                 userId:
 *                   type: string
 *                   example: 67f21872f0f95a0e94a0c123
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc username đã tồn tại
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles(["admin"]),
  validate(AddUserSchema),
  userController.addUser,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.get("/", verifyToken, userController.getAllUsers);

/**
 * @swagger
 * /api/users/password:
 *   patch:
 *     summary: Đổi mật khẩu cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.patch(
  "/password",
  verifyToken,
  validate(ChangePasswordSchema),
  userController.changePassword,
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Huu Khang
 *               username:
 *                 type: string
 *                 example: khang123
 *     responses:
 *       200:
 *         description: Cập nhật hồ sơ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc username đã tồn tại
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.put(
  "/profile",
  verifyToken,
  validate(UpdateProfileSchema),
  userController.updateProfile,
);

/**
 * @swagger
 * /api/users/push-token:
 *   post:
 *     summary: Thêm push token notification cho người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 example: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 *     responses:
 *       200:
 *         description: Thêm push token thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       404:
 *         description: User not found
 */
router.post(
  "/push-token",
  verifyToken,
  validate(PushTokenSchema),
  userController.addPushToken,
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của người dùng
 *         schema:
 *           type: string
 *           example: 67f21872f0f95a0e94a0c123
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       404:
 *         description: User not found
 */
router.get("/:id", verifyToken, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của người dùng
 *         schema:
 *           type: string
 *           example: 67f21872f0f95a0e94a0c123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: khang123
 *               fullName:
 *                 type: string
 *                 example: Nguyen Huu Khang
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 example: user
 *     responses:
 *       200:
 *         description: Cập nhật người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc username đã tồn tại
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(["admin"]),
  userController.updateUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa người dùng theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của người dùng
 *         schema:
 *           type: string
 *           example: 67f21872f0f95a0e94a0c123
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       400:
 *         description: Không thể xóa chính mình
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Bạn không có quyền xóa người dùng
 *       404:
 *         description: User not found
 */
router.delete("/:id", verifyToken, userController.deleteUser);


/**
 * @swagger
 * /api/users/{id}/inactivate:
 *   post:
 *     summary: Vô hiệu hóa người dùng (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của người dùng
 *         schema:
 *           type: string
 *           example: 67f21872f0f95a0e94a0c123
 *     responses:
 *       200:
 *         description: Vô hiệu hóa người dùng thành công
 *       400:
 *         description: Không thể vô hiệu hóa chính mình
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Bạn không có quyền thực hiện hành động này
 *       404:
 *         description: User not found
 */
router.post(
  "/:id/inactivate",
  verifyToken,
  authorizeRoles(["admin"]),
  userController.inactivateUser,
);

/**
 * @swagger
 * /api/users/{id}/reactivate:
 *   post:
 *     summary: Kích hoạt lại người dùng (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của người dùng
 *         schema:
 *           type: string
 *           example: 67f21872f0f95a0e94a0c123
 *     responses:
 *       200:
 *         description: Kích hoạt lại người dùng thành công
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 *       403:
 *         description: Bạn không có quyền thực hiện hành động này
 *       404:
 *         description: User not found
 */
router.post(
  "/:id/reactivate",
  verifyToken,
  authorizeRoles(["admin"]),
  userController.reactivateUser,
);

export default router;
