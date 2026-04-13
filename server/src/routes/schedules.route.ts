import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import validate from "../middleware/validateMiddleware";
import scheduleController from "../controllers/schedule.controller";
import {
  AddScheduleSchema,
  UpdateScheduleSchema,
} from "../models/ScheduleSchema";

const router = Router();

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Lấy danh sách lịch
 *     description: Có thể lọc theo deviceId bằng query param
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: false
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Danh sách lịch
 *       400:
 *         description: deviceId không hợp lệ
 *       500:
 *         description: Server Error
 */
router.get("/", verifyToken, scheduleController.getSchedules);

/**
 * @swagger
 * /api/schedules/device/{deviceId}:
 *   get:
 *     summary: Lấy lịch theo id thiết bị
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Danh sách lịch theo thiết bị
 *       400:
 *         description: deviceId không hợp lệ
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.get(
  "/device/:deviceId",
  verifyToken,
  scheduleController.getSchedulesByDeviceId,
);

/**
 * @swagger
 * /api/schedules/devices/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch theo ID
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f9999
 *     responses:
 *       200:
 *         description: Chi tiết lịch
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server Error
 */
router.get("/devices/:id", verifyToken, scheduleController.getScheduleById);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Tạo lịch mới
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - triggerTime
 *               - action
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: 65f2c1d9e8c1a32b1a6f1234
 *               triggerTime:
 *                 type: string
 *                 example: "07:30"
 *               action:
 *                 type: string
 *                 enum: [on, off]
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 *     responses:
 *       201:
 *         description: Tạo lịch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.post(
  "/",
  verifyToken,
  validate(AddScheduleSchema),
  scheduleController.addSchedule,
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Cập nhật lịch
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f9999
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: 65f2c1d9e8c1a32b1a6f1234
 *               triggerTime:
 *                 type: string
 *                 example: "08:00"
 *               action:
 *                 type: string
 *                 enum: [on, off]
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 *     responses:
 *       200:
 *         description: Cập nhật lịch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Schedule hoặc Device không tồn tại
 *       500:
 *         description: Server Error
 */
router.put(
  "/:id",
  verifyToken,
  validate(UpdateScheduleSchema),
  scheduleController.updateSchedule,
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Xóa lịch
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f9999
 *     responses:
 *       200:
 *         description: Xóa lịch thành công
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server Error
 */
router.delete("/:id", verifyToken, scheduleController.deleteSchedule);


/**
 * @swagger
 * /api/schedules/{id}/switch:
 *   patch:
 *     summary: Chuyển trạng thái kích hoạt của lịch (bật/tắt)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f9999
 *     responses:
 *       200:
 *         description: Chi tiết lịch
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server Error
 */
router.patch("/:id/switch", verifyToken, scheduleController.switchScheduleStatus);

export default router;
