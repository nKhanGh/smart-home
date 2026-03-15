import { Document, model, Schema, Types } from "mongoose";

export interface IDataDoc extends Document {
  deviceId: Types.ObjectId;
  type    : "tempSensor" | "lightSensor" | "humiditySensor" | "light" | "fan";
  value : string | number | boolean;
  recordedAt: Date;
}

const DataSchema = new Schema<IDataDoc>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  type    : { type: String, enum: ["tempSensor", "lightSensor", "humiditySensor", "light", "fan"], required: true },
  value   : { type: Schema.Types.Mixed, required: true },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<IDataDoc>("Data", DataSchema);