import { Document, model, Schema, Types } from "mongoose";
import z from "zod";

export interface IScheduleDoc extends Document {
  deviceId: Types.ObjectId;
  triggerTime: string; // "HH:mm" format
  action: "on" | "off";
  repeatDays: string[]; // ["Mon", "Tue", ...]
  createdAt: Date;
}

const ScheduleSchema = new Schema<IScheduleDoc>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  triggerTime: { type: String, required: true },
  action: { type: String, enum: ["on", "off"], required: true },
  repeatDays: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const AddScheduleSchema = z.object({
  deviceId: z.string().min(1, "Thiết bị không được để trống."),
  triggerTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Thời gian phải có định dạng HH:mm."),
  action: z.enum(["on", "off"], { message: "Hành động phải là 'on' hoặc 'off'." }),
  repeatDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], { message: "Ngày lặp lại không hợp lệ." })).optional()
});

export default model<IScheduleDoc>("Schedule", ScheduleSchema);