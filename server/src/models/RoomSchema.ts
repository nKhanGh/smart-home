import { Schema, model, Document, Types } from "mongoose";

export interface IRoomDoc extends Document {
  name   : string;
  key    : string;
  devices: Types.ObjectId[];
  background_name: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>({
  name   : { type: String, required: true },
  key    : { type: String, required: true, unique: true },
  devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  background_name: { type: String, default: "default.jpg" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model<IRoomDoc>("Room", RoomSchema);
