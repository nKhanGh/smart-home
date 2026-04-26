import z from "zod";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY_ENUM = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const AddDeviceActionScheduleSchema = z.object({
  deviceId: z.string().min(1, "Thiết bị không được để trống."),
  triggerTime: z
    .string()
    .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm."),
  action: z.enum(["on", "off"], {
    message: "Hành động phải là 'on' hoặc 'off'.",
  }),
  repeatDays: z
    .array(
      z.enum(WEEKDAY_ENUM, {
        message: "Ngày lặp lại không hợp lệ.",
      }),
    )
    .optional(),
  active: z.boolean().default(true),
});

export type AddDeviceActionScheduleInput = z.infer<
  typeof AddDeviceActionScheduleSchema
>;

export const UpdateDeviceActionScheduleSchema = z.object({
  deviceId: z.string().min(1, "Thiết bị không được để trống.").optional(),
  triggerTime: z
    .string()
    .regex(HH_MM_REGEX, "Thời gian phải có định dạng HH:mm.")
    .optional(),
  action: z
    .enum(["on", "off"], {
      message: "Hành động phải là 'on' hoặc 'off'.",
    })
    .optional(),
  repeatDays: z
    .array(
      z.enum(WEEKDAY_ENUM, {
        message: "Ngày lặp lại không hợp lệ.",
      }),
    )
    .optional(),
  active: z.boolean().optional(),
});

export type UpdateDeviceActionScheduleInput = z.infer<
  typeof UpdateDeviceActionScheduleSchema
>;
