import { Document, model, Schema, Types } from "mongoose";
import z from "zod";

export interface IThreshold extends Document {
  deviceId: Types.ObjectId;
  sensorId: Types.ObjectId;
  value: number;
  when: "above" | "below";
  action: "on" | "off" | "alert";
  createdAt: Date;
  updatedAt: Date;
  updatedBy: Types.ObjectId | string;
  active: boolean;
}

const ThresholdSchema = new Schema<IThreshold>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    sensorId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    active: { type: Boolean, default: true },
    value: { type: Number, required: true },
    when: { type: String, enum: ["above", "below"], required: true },
    action: {
      type: String,
      enum: ["on", "off", "alert"],
      required: true,
      default: "on",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true },
);

ThresholdSchema.index({ deviceId: 1, sensorId: 1, when: 1, action: 1 });

export const UpdateThresholdSchema = z.object({
  value: z.number().refine((val) => val !== undefined && val !== null, {
    message: "Giá trị ngưỡng không được để trống.",
  }),
  action: z.enum(["on", "off", "alert"]),
  sensorId: z.string().refine((id) => Types.ObjectId.isValid(id), {
    message: "sensorId phải là một ObjectId hợp lệ.",
  }),
  when: z.enum(["above", "below"]),
});

export const CreateThresholdSchema = UpdateThresholdSchema;

export const SetThresholdActiveSchema = z.object({
  active: z.boolean({
    message: "active phải là true hoặc false.",
  }),
});

export type UpdateThresholdInput = z.infer<typeof UpdateThresholdSchema>;

export type CreateThresholdInput = z.infer<typeof CreateThresholdSchema>;

export type SetThresholdActiveInput = z.infer<typeof SetThresholdActiveSchema>;

export default model<IThreshold>("Threshold", ThresholdSchema);
