import { Document, model, Schema, Types } from "mongoose";

export interface IDataDoc extends Document {
  deviceId: Types.ObjectId;
  value : string;
  recordedAt: Date;
}

const DataSchema = new Schema<IDataDoc>({
  deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
  value   : { type: String, required: true },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<IDataDoc>("Data", DataSchema);