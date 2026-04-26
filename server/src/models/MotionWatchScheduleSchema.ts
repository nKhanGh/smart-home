import { Document, model, Schema, Types } from "mongoose";

export interface IMotionWatchScheduleDoc extends Document {
  deviceId: Types.ObjectId;
  active: boolean;
  repeatDays: string[];
  startTime: string;
  endTime: string;
  triggerCount: number;
  countWindowMinutes: number;
  minSignalIntervalSeconds: number;
  cooldownMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const MotionWatchScheduleSchema = new Schema<IMotionWatchScheduleDoc>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    active: { type: Boolean, default: true },
    repeatDays: { type: [String], default: [] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    triggerCount: { type: Number, default: 3 },
    countWindowMinutes: { type: Number, default: 5 },
    minSignalIntervalSeconds: { type: Number, default: 8 },
    cooldownMinutes: { type: Number, default: 10 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model<IMotionWatchScheduleDoc>(
  "MotionWatchSchedule",
  MotionWatchScheduleSchema,
);
