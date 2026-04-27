import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import deviceController from "../controllers/device.controller";
import validate from "../middleware/validateMiddleware";
import {
  SendCommandSchema,
  UpdateDevicePasswordSchema,
  UpdateDeviceSchema,
  VoiceCommandSchema,
} from "../models/DeviceSchema";

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
 * /api/devices/sensors:
 *   get:
 *     summary: Lấy danh sách thiết bị cảm biến (temp, bri, hum)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị cảm biến
 *       404:
 *         description: Không tìm thấy thiết bị cảm biến
 */
router.get("/sensors", verifyToken, deviceController.getSensorDevices);

/**
 * @swagger
 * /api/devices/threshold:
 *   get:
 *     summary: Lấy danh sách thiết bị ngưỡng
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thiết bị ngưỡng
 *       404:
 *         description: Không tìm thấy thiết bị ngưỡng
 */
router.get("/threshold", verifyToken, deviceController.getThresholdDevices);


/**
 * @swagger
 * /api/devices/{id}/password:
 *   patch:
 *     summary: Cập nhật mật khẩu thiết bị (chỉ dành cho doorDevice)
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
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               oldPassword:
 *                 type: string
 *                 example: oldpassword123
 *                 description: Bắt buộc khi thiết bị đã có mật khẩu trước đó
 *     responses:
 *       200:
 *         description: Cập nhật mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: "200"
 *                 msg:
 *                   type: string
 *                   example: Cập nhật mật khẩu thành công.
 *       400:
 *         description: Thiếu newPassword hoặc thiết bị không phải doorDevice
 *       403:
 *         description: Mật khẩu hiện tại không đúng
 *       404:
 *         description: Device not found
 */
router.patch(
  "/:id/password",
  verifyToken,
  validate(UpdateDevicePasswordSchema),
  deviceController.updatePassword,
);

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
 *           example: 65f2c1d9e8c1a32b1a6f1234
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
 *           example: 65f2c1d9e8c1a32b1a6f1234
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
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 0
 *       - name: size
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
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
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 0
 *       - name: size
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách log
 *       404:
 *         description: Device not found
 */
router.get("/:id/logs", verifyToken, deviceController.getLogs);

// /**
//  * @swagger
//  * /api/devices:
//  *   post:
//  *     summary: Thêm thiết bị mới
//  *     tags: [Devices]
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
//  *               - roomId
//  *               - type
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: Đèn phòng khách
//  *               description:
//  *                 type: string
//  *                 example: Đèn LED phòng khách
//  *               roomId:
//  *                 type: string
//  *                 example: room1
//  *               type:
//  *                 type: string
//  *                 example: light
//  *     responses:
//  *       201:
//  *         description: Thêm thiết bị thành công
//  *       400:
//  *         description: Dữ liệu không hợp lệ
//  */
// router.post(
//   "/",
//   verifyToken,
//   validate(AddDeviceSchema),
//   deviceController.addDevice,
// );

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
 *           example: 65f2c1d9e8c1a32b1a6f1234
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

// /**
//  * @swagger
//  * /api/devices/{id}:
//  *   delete:
//  *     summary: Xóa thiết bị
//  *     tags: [Devices]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         schema:
//  *           type: string
//  *           example: 65f2c1d9e8c1a32b1a6f1234
//  *     responses:
//  *       200:
//  *         description: Xóa thiết bị thành công
//  *       404:
//  *         description: Device not found
//  */
// router.delete("/:id", verifyToken, deviceController.deleteDevice);

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
 *           example: 65f2c1d9e8c1a32b1a6f1234
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
router.post(
  "/command/:id",
  verifyToken,
  validate(SendCommandSchema),
  deviceController.sendCommand,
);

/**
 * @swagger
 * /api/devices/voice-command:
 *   post:
 *     summary: Điều khiển thiết bị bằng câu lệnh giọng nói (text)
 *     description: Nhận text đã chuyển từ giọng nói, phân tích action + thiết bị + phòng rồi gửi lệnh điều khiển.
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
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: hãy bật đèn chính phòng khách
 *     responses:
 *       200:
 *         description: Phân tích và gửi lệnh thành công
 *       400:
 *         description: Không xác định được hành động hoặc câu lệnh không hợp lệ
 *       404:
 *         description: Không tìm thấy thiết bị phù hợp
 *       409:
 *         description: Câu lệnh mơ hồ, khớp nhiều phòng hoặc nhiều thiết bị
 *       500:
 *         description: Server Error
 */
router.post(
  "/voice-command",
  verifyToken,
  validate(VoiceCommandSchema),
  deviceController.executeVoiceCommand,
);

/**
 * @swagger
 * /api/devices/{id}/current-data:
 *   get:
 *     summary: Lấy dữ liệu sensor hiện tại của thiết bị
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
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Dữ liệu sensor hiện tại
 *       404:
 *         description: Device not found
 */
router.get("/:id/current-data", verifyToken, deviceController.getCurrentData);

/**
 * @swagger
 * /api/devices/{id}/current-action:
 *   get:
 *     summary: Lấy hành động hiện tại của thiết bị
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
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Hành động hiện tại
 *       404:
 *         description: Device not found
 */
router.get(
  "/:id/current-action",
  verifyToken,
  deviceController.getCurrentAction,
);


export default router;
