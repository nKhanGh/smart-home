import { Schema, model, Document, Types } from "mongoose";

export interface IActionLogDoc extends Document {
  user       : Types.ObjectId;
  deviceId   : Types.ObjectId;
  userId     : string;
  deviceName: string;
  action     : string;
  actor      : string;
  createdAt : Date;
}

const ActionLogSchema = new Schema<IActionLogDoc>({
  user       : { type: Schema.Types.ObjectId, ref: "User" },
  deviceId   : { type: Schema.Types.ObjectId, ref: "Device", required: true },
  deviceName: { type: String, required: true },
  action     : { type: String, required: true },
  actor      : { type: String, required: true },
  createdAt : { type: Date, default: Date.now },
});

export default model<IActionLogDoc>("ActionLog", ActionLogSchema);
