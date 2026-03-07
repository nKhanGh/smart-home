import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getDevices, getDeviceById, getDeviceData,
  addDevice, updateDevice, deleteDevice,
  sendCommand, getLogs,
} from "../controllers/deviceController";

const router = Router();

const addRules = [
  check("device_id",  "device_id không được trống").notEmpty(),
  check("name",       "name không được trống").notEmpty(),
  check("room_name",  "room_name không được trống").notEmpty(),
];

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Lấy danh sách thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị
 */
router.get("/", verifyToken, getDevices);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Lấy thông tin thiết bị theo ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: device_id
 *         schema:
 *           type: string
 *           example: led_room1
 *     responses:
 *       200:
 *         description: Thông tin thiết bị
 *       404:
 *         description: Device not found
 */
router.get("/:id", verifyToken, getDeviceById);

/**
 * @swagger
 * /api/devices/{id}/data:
 *   get:
 *     summary: Lấy dữ liệu sensor của thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: device_id
 *         schema:
 *           type: string
 *           example: temp_sensor_room1
 *     responses:
 *       200:
 *         description: Dữ liệu sensor
 *       404:
 *         description: Device not found
 */
router.get("/:id/data", verifyToken, getDeviceData);

/**
 * @swagger
 * /api/devices/{id}/logs:
 *   get:
 *     summary: Lấy lịch sử hành động của thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: device_id
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách log
 */
router.get("/:id/logs", verifyToken, getLogs);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Thêm thiết bị mới
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - name
 *               - room_name
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: led_room1
 *               name:
 *                 type: string
 *                 example: Đèn phòng khách
 *               description:
 *                 type: string
 *                 example: Đèn LED phòng khách
 *               room_name:
 *                 type: string
 *                 example: living_room
 *     responses:
 *       201:
 *         description: Thêm thiết bị thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/", verifyToken, addRules, addDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Cập nhật thông tin thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: led_room1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", verifyToken, updateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Xóa thiết bị
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: led_room1
 *     responses:
 *       200:
 *         description: Xóa thiết bị thành công
 *       404:
 *         description: Device not found
 */
router.delete("/:id", verifyToken, deleteDevice);

/**
 * @swagger
 * /api/devices/command:
 *   post:
 *     summary: Gửi lệnh điều khiển thiết bị
 *     description: App -> Backend -> MQTT -> Adafruit -> YoloBit
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - action
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: led_room1
 *               action:
 *                 type: string
 *                 example: ON
 *     responses:
 *       200:
 *         description: Đã gửi lệnh điều khiển
 *       404:
 *         description: Device not found
 */
router.post("/command", verifyToken, sendCommand);

export default router;