import { Document, model, Schema, Types } from "mongoose";

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

export default model<IScheduleDoc>("Schedule", ScheduleSchema);