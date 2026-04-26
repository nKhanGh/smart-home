import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../middleware/authMiddleware";
import validate from "../middleware/validateMiddleware";
import scheduleController from "../controllers/schedule.controller";
import {
  AddDeviceActionScheduleSchema,
  UpdateDeviceActionScheduleSchema,
} from "../models/DeviceActionScheduleValidation";
import {
  AddMotionWatchScheduleSchema,
  UpdateMotionWatchScheduleSchema,
} from "../models/MotionWatchScheduleValidation";

const UpdateScheduleSchema = z.union([
  UpdateDeviceActionScheduleSchema,
  UpdateMotionWatchScheduleSchema,
]);

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
 * /api/schedules/device-actions:
 *   post:
 *     summary: Tạo lịch điều khiển thiết bị theo giờ
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
 *         description: Tạo lịch điều khiển thiết bị thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.post(
  "/device-actions",
  verifyToken,
  validate(AddDeviceActionScheduleSchema),
  scheduleController.addDeviceActionSchedule,
);

/**
 * @swagger
 * /api/schedules/motion-watch:
 *   post:
 *     summary: Tạo lịch giám sát motion sensor theo khung giờ
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
 *               - startTime
 *               - endTime
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: 65f2c1d9e8c1a32b1a6f1234
 *               startTime:
 *                 type: string
 *                 example: "22:00"
 *               endTime:
 *                 type: string
 *                 example: "05:30"
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 *               triggerCount:
 *                 type: integer
 *                 example: 3
 *               countWindowMinutes:
 *                 type: integer
 *                 example: 5
 *               minSignalIntervalSeconds:
 *                 type: integer
 *                 example: 8
 *               cooldownMinutes:
 *                 type: integer
 *                 example: 10
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo lịch giám sát chuyển động thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không phải motion sensor
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.post(
  "/motion-watch",
  verifyToken,
  validate(AddMotionWatchScheduleSchema),
  scheduleController.addMotionWatchSchedule,
);

/**
 * @swagger
 * /api/schedules/motion-watch:
 *   get:
 *     summary: Lấy danh sách lịch motion watch theo thiết bị
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: 65f2c1d9e8c1a32b1a6f1234
 *     responses:
 *       200:
 *         description: Danh sách lịch motion watch
 *       400:
 *         description: deviceId không hợp lệ hoặc thiếu deviceId
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server Error
 */
router.get(
  "/motion-watch",
  verifyToken,
  scheduleController.getMotionWatchSchedules,
);

/**
 * @swagger
 * /api/schedules/motion-watch/{id}:
 *   patch:
 *     summary: Cập nhật lịch motion watch
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
 *               startTime:
 *                 type: string
 *                 example: "22:00"
 *               endTime:
 *                 type: string
 *                 example: "05:30"
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 *               triggerCount:
 *                 type: integer
 *                 example: 3
 *               countWindowMinutes:
 *                 type: integer
 *                 example: 5
 *               minSignalIntervalSeconds:
 *                 type: integer
 *                 example: 8
 *               cooldownMinutes:
 *                 type: integer
 *                 example: 10
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật lịch motion watch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: MotionWatch schedule not found
 *       500:
 *         description: Server Error
 */
router.patch(
  "/motion-watch/:id",
  verifyToken,
  validate(UpdateMotionWatchScheduleSchema),
  scheduleController.updateMotionWatchSchedule,
);

/**
 * @swagger
 * /api/schedules/motion-watch/{id}:
 *   delete:
 *     summary: Xóa lịch motion watch
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
 *         description: Xóa lịch motion watch thành công
 *       404:
 *         description: MotionWatch schedule not found
 *       500:
 *         description: Server Error
 */
router.delete(
  "/motion-watch/:id",
  verifyToken,
  scheduleController.deleteMotionWatchSchedule,
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
router.patch(
  "/:id/switch",
  verifyToken,
  scheduleController.switchScheduleStatus,
);

export default router;
