import { Schema, model, Document, Types } from "mongoose";

export interface IActionLogDoc extends Document {
  user       : Types.ObjectId;
  device     : Types.ObjectId;
  device_name: string;
  action     : string;
  actor      : string;
  created_at : Date;
}

const ActionLogSchema = new Schema<IActionLogDoc>({
  user       : { type: Schema.Types.ObjectId, ref: "User" },
  device     : { type: Schema.Types.ObjectId, ref: "Device", required: true },
  device_name: { type: String, required: true },
  action     : { type: String, required: true },
  actor      : { type: String, required: true },
  created_at : { type: Date, default: Date.now },
});

export default model<IActionLogDoc>("ActionLog", ActionLogSchema);
