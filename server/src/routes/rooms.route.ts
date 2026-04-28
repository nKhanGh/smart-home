import { Router } from "express";
import { authorizeRoles, verifyToken } from "../middleware/authMiddleware";
import roomController from "../controllers/room.controller";
import validate from "../middleware/validateMiddleware";
import { AddRoomSchema } from "../models/RoomSchema";

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
 *                         mode:
 *                           type: string
 *                           example: auto
 *                         type:
 *                           type: string
 *                           example: lightSensor
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, roomController.getRooms);


/** * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Lấy thông tin phòng theo ID
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
 *         description: Thông tin phòng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                   example: Phòng khách
 *                 key:
 *                   type: string
 *                   example: living_room
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       device_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                       description:
 *                         type: string
 *                       mode:
 *                         type: string
 *                         example: auto
 *                       type:
 *                         type: string
 *                         example: lightSensor
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server Error
 */

router.get("/:id", verifyToken, roomController.getRoomById);


/** * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Cập nhật thông tin phòng
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Phòng khách
 *               backgroundName:
 *                 type: string
 *                 example: living_room.jpg
 *     responses:
 *       200:
 *         description: Phòng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                   example: Phòng khách
 *                 key:
 *                   type: string
 *                   example: living_room
*                 devices:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       device_id:
*                         type: string
*                       name:
*                         type: string
*                       key:
*                         type: string
*                       description:
*                         type: string
*                       mode:
*                         type: string
*                         example: auto
*                       type:
*                         type: string
*                         example: lightSensor
*       404:
*         description: Room not found
*       500:
*         description: Server Error
 */

router.put("/:id", verifyToken, authorizeRoles(["admin"]), validate(AddRoomSchema), roomController.updateRoom);

// /**
//  * @swagger
//  * /api/rooms:
//  *   post:
//  *     summary: Thêm phòng mới
//  *     tags: [Rooms]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: Phòng ngủ
//  *               backgroundName:
//  *                 type: string
//  *                 example: bedroom.jpg
//  *     responses:
//  *       201:
//  *         description: Thêm phòng thành công
//  *       400:
//  *         description: Key phòng đã tồn tại hoặc dữ liệu không hợp lệ
//  *       500:
//  *         description: Server Error
//  */
// router.post("/", verifyToken, validate(AddRoomSchema), roomController.addRoom);

// /**
//  * @swagger
//  * /api/rooms/{id}:
//  *   delete:
//  *     summary: Xóa phòng
//  *     tags: [Rooms]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         description: ID của phòng
//  *         schema:
//  *           type: string
//  *           example: 65f2c1d9e8c1a32b1a6f1234
//  *     responses:
//  *       200:
//  *         description: Xóa phòng thành công
//  *       404:
//  *         description: Room not found
//  *       500:
//  *         description: Server Error
//  */
// router.delete("/:id", verifyToken, roomController.deleteRoom);

export default router;
