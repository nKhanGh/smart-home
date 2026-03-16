import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import deviceController from "../controllers/device.controller";
import validate from "../middleware/validateMiddleware";
import { AddDeviceSchema, UpdateDeviceSchema } from "../models/DeviceSchema";

const router = Router();

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
router.get("/", verifyToken, deviceController.getDevices);

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
router.get("/:id", verifyToken, deviceController.getDeviceById);

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
router.get("/:id/data", verifyToken, deviceController.getDeviceData);

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
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Danh sách log
 *       404:
 *         description: Device not found
 */
router.get("/:id/logs", verifyToken, deviceController.getLogs);

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
 *               - name
 *               - roomId
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Đèn phòng khách
 *               description:
 *                 type: string
 *                 example: Đèn LED phòng khách
 *               roomId:
 *                 type: string
 *                 example: room1
 *               type:
 *                 type: string
 *                 example: light
 *     responses:
 *       201:
 *         description: Thêm thiết bị thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  "/",
  verifyToken,
  validate(AddDeviceSchema),
  deviceController.addDevice,
);

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
 *                 example: Đèn phòng khách
 *               roomId:
 *                 type: string
 *                 example: room1
 *               mode:
 *                 type: string
 *                 example: manual
 *               description:
 *                 type: string
 *                 example: Đèn LED phòng khách
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  "/:id",
  verifyToken,
  validate(UpdateDeviceSchema),
  deviceController.updateDevice,
);

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
router.delete("/:id", verifyToken, deviceController.deleteDevice);

/**
 * @swagger
 * /api/devices/command/{id}:
 *   post:
 *     summary: Gửi lệnh điều khiển thiết bị
 *     description: App -> Backend -> MQTT -> Adafruit -> YoloBit
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 example: on
 *     responses:
 *       200:
 *         description: Đã gửi lệnh điều khiển
 *       404:
 *         description: Device not found
 */
router.post("/command/:id", verifyToken, deviceController.sendCommand);

export default router;
