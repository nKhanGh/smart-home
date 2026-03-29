import { Schema, model, Document, Types } from "mongoose";

export interface IActionLogDoc extends Document {
  userId     : Types.ObjectId;
  deviceId   : Types.ObjectId;
  action     : string;
  actor      : string;
  createdAt  : Date;
}

const ActionLogSchema = new Schema<IActionLogDoc>({
  userId     : { type: Schema.Types.ObjectId, ref: "User" },
  deviceId   : { type: Schema.Types.ObjectId, ref: "Device", required: true },
  action     : { type: String, required: true },
  actor      : { type: String, required: true },
  createdAt  : { type: Date, default: Date.now },
});

export default model<IActionLogDoc>("ActionLog", ActionLogSchema);
