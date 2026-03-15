import { Document, model, Schema, Types } from "mongoose";
import z from "zod";

export interface IThreshold extends Document {
  deviceId: Types.ObjectId;
  value: number;
  updatedAt: Date;
  updatedBy: Types.ObjectId | string;
}

const ThresholdSchema = new Schema<IThreshold>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  value: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false }
}, { timestamps: true });

export const UpdateThresholdSchema = z.object({
  value: z.number().refine(val => val !== undefined && val !== null, {
    message: "Giá trị ngưỡng không được để trống."
  })
});

export default model<IThreshold>("Threshold", ThresholdSchema);

