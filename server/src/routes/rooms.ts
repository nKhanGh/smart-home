import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import { getRooms, addRoom, deleteRoom } from "../controllers/roomController";

const router = Router();

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Lấy danh sách phòng
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phòng cùng thiết bị trong phòng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     example: Phòng khách
 *                   key:
 *                     type: string
 *                     example: living_room
 *                   devices:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         device_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         key:
 *                           type: string
 *                         description:
 *                           type: string
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, getRooms);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Thêm phòng mới
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - key
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phòng ngủ
 *               key:
 *                 type: string
 *                 example: bedroom
 *     responses:
 *       201:
 *         description: Thêm phòng thành công
 *       400:
 *         description: Key phòng đã tồn tại hoặc dữ liệu không hợp lệ
 *       500:
 *         description: Server Error
 */
router.post(
  "/",
  verifyToken,
  [
    check("name", "Tên phòng không được trống").notEmpty(),
    check("key", "Key phòng không được trống").notEmpty(),
  ],
  addRoom
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Xóa phòng
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID của phòng
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Xóa phòng thành công
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server Error
 */
router.delete("/:id", verifyToken, deleteRoom);

export default router;