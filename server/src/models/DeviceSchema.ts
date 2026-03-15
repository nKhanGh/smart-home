import { Schema, model, Document, Types } from "mongoose";

export interface IDeviceDoc extends Document {
  name       : string;
  description: string;
  key        : string;          // Adafruit feed key
  mode       : "auto" | "manual";
  room       : Types.ObjectId;
  type       : "tempSensor" | "lightSensor" | "humiditySensor" | "light" | "fan";
  createdBy: Types.ObjectId;
  createdAt: Date;
}


const DeviceSchema = new Schema<IDeviceDoc>({
  name       : { type: String, required: true },
  key        : { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  mode       : { type: String, enum: ["auto", "manual"], default: "manual" },
  room       : { type: Schema.Types.ObjectId, ref: "Room", required: true },
  type       : { type: String, enum: ["tempSensor", "lightSensor", "humiditySensor", "light", "fan"], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<IDeviceDoc>("Device", DeviceSchema);
