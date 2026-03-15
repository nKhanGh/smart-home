import { Document, Types, Schema, model } from "mongoose";

export interface ISensorAlertDoc extends Document {
  deviceId: Types.ObjectId;
  value: string;
  createdAt: Date;
  threshold: number;
}

const SensorAlertSchema = new Schema<ISensorAlertDoc>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  value: { type: String, required: true },
  threshold: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<ISensorAlertDoc>("SensorAlert", SensorAlertSchema);