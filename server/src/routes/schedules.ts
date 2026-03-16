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
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
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
 */
router.get(
  "/device/:deviceId",
  verifyToken,
  scheduleController.getSchedulesByDeviceId,
);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Lấy chi tiết lịch theo ID
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", verifyToken, scheduleController.getScheduleById);

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
 *             $ref: "#/components/schemas/AddSchedule"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateSchedule"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/DeleteSchedule"
 */
router.delete("/:id", verifyToken, scheduleController.deleteSchedule);

export default router;
