import { Document, model, Schema, Types } from "mongoose";

export interface IThreshold extends Document {
  deviceId: Types.ObjectId;
  value: number;
  updatedAt: Date;
  updatedBy: string;
}

const ThresholdSchema = new Schema<IThreshold>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  value: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, required: true }
}, { timestamps: true });

export default model<IThreshold>("Threshold", ThresholdSchema);

