import { Schema, model, Document, Types } from "mongoose";
import z from "zod";

export interface IRoomDoc extends Document {
  name   : string;
  key    : string;
  devices: Types.ObjectId[];
  backgroundName: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>({
  name   : { type: String, required: true, unique: true },
  key    : { type: String, required: true, unique: true },
  devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  backgroundName: { type: String, default: "default.jpg" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const AddRoomSchema = z.object({
  name: z.string().min(1, "Tên phòng không được để trống."),
  backgroundName: z.string().optional()
});

export type AddRoomInput = z.infer<typeof AddRoomSchema>;

export default model<IRoomDoc>("Room", RoomSchema);
