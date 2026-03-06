import { Schema, model, Document, Types } from "mongoose";

export interface IRoomDoc extends Document {
  name   : string;
  key    : string;
  devices: Types.ObjectId[];
}

const RoomSchema = new Schema<IRoomDoc>({
  name   : { type: String, required: true },
  key    : { type: String, required: true, unique: true },
  devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
}, { timestamps: true });

export default model<IRoomDoc>("Room", RoomSchema);
