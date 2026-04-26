import z from "zod";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY_ENUM = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const AddMotionWatchScheduleSchema = z
  .object({
    deviceId: z.string().min(1, "Thiết bị không được để trống."),
    startTime: z
      .string()
      .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm."),
    endTime: z
      .string()
      .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm."),
    repeatDays: z
      .array(
        z.enum(WEEKDAY_ENUM, {
          message: "Ngày lặp lại không hợp lệ.",
        }),
      )
      .optional(),
    triggerCount: z.number().int().min(1).max(20).optional(),
    countWindowMinutes: z.number().int().min(1).max(120).optional(),
    minSignalIntervalSeconds: z.number().int().min(0).max(300).optional(),
    cooldownMinutes: z.number().int().min(0).max(720).optional(),
    active: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.startTime === value.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "startTime và endTime không được trùng nhau.",
        path: ["endTime"],
      });
    }
  });

export type AddMotionWatchScheduleInput = z.infer<
  typeof AddMotionWatchScheduleSchema
>;

export const UpdateMotionWatchScheduleSchema = z
  .object({
    deviceId: z.string().min(1, "Thiết bị không được để trống.").optional(),
    repeatDays: z
      .array(
        z.enum(WEEKDAY_ENUM, {
          message: "Ngày lặp lại không hợp lệ.",
        }),
      )
      .optional(),
    startTime: z
      .string()
      .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm.")
      .optional(),
    endTime: z
      .string()
      .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm.")
      .optional(),
    triggerCount: z.number().int().min(1).max(20).optional(),
    countWindowMinutes: z.number().int().min(1).max(120).optional(),
    minSignalIntervalSeconds: z.number().int().min(0).max(300).optional(),
    cooldownMinutes: z.number().int().min(0).max(720).optional(),
    active: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startTime && value.endTime && value.startTime === value.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "startTime và endTime không được trùng nhau.",
        path: ["endTime"],
      });
    }
  });

export type UpdateMotionWatchScheduleInput = z.infer<
  typeof UpdateMotionWatchScheduleSchema
>;
