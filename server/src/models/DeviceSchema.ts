import { Schema, model, Document, Types } from "mongoose";

interface IDataPoint {
  value     : string;
  created_at: Date;
}

export interface IDeviceDoc extends Document {
  device_id  : string;
  name       : string;
  key        : string;          // Adafruit feed key
  description: string;
  room       : Types.ObjectId;
  data       : IDataPoint[];
}

const DataPointSchema = new Schema<IDataPoint>({
  value     : { type: String, required: true },
  created_at: { type: Date,   default: Date.now },
}, { _id: false });

const DeviceSchema = new Schema<IDeviceDoc>({
  device_id  : { type: String, required: true, unique: true },
  name       : { type: String, required: true },
  key        : { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  room       : { type: Schema.Types.ObjectId, ref: "Room", required: true },
  data       : { type: [DataPointSchema], default: [] },
}, { timestamps: true });

// Giới hạn 1000 điểm data — tránh document phình to
DeviceSchema.methods.pushData = function (value: string) {
  this.data.push({ value, created_at: new Date() });
  if (this.data.length > 1000) this.data.shift();
};

export default model<IDeviceDoc>("Device", DeviceSchema);
