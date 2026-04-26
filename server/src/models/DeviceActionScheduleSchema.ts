import { Document, model, Schema, Types } from "mongoose";

export interface IDeviceActionScheduleDoc extends Document {
  deviceId: Types.ObjectId;
  triggerTime: string;
  action: "on" | "off";
  active: boolean;
  repeatDays: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceActionScheduleSchema = new Schema<IDeviceActionScheduleDoc>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    triggerTime: { type: String, required: true },
    action: { type: String, enum: ["on", "off"], required: true },
    active: { type: Boolean, default: true },
    repeatDays: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model<IDeviceActionScheduleDoc>(
  "DeviceActionSchedule",
  DeviceActionScheduleSchema,
);
