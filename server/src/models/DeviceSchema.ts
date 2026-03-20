import { Schema, model, Document, Types } from "mongoose";
import z from "zod";

export interface IDeviceDoc extends Document {
  name: string;
  description: string;
  key: string; // Adafruit feed key
  mode: "auto" | "manual";
  roomId: Types.ObjectId;
  type: "tempSensor" | "lightSensor" | "humiditySensor" | "light" | "fan";
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const DeviceSchema = new Schema<IDeviceDoc>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    mode: { type: String, enum: ["auto", "manual"], default: "manual" },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    type: {
      type: String,
      enum: ["tempSensor", "lightSensor", "humiditySensor", "light", "fan"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const AddDeviceSchema = z.object({
  name: z.string().min(1, "Tên thiết bị không được để trống."),
  description: z.string().optional(),
  roomId: z.string().min(1, "Phòng không được để trống."),
  type: z.enum(
    ["tempSensor", "lightSensor", "humiditySensor", "light", "fan"],
    { message: "Loại thiết bị không hợp lệ." },
  ),
});

export type AddDeviceInput = z.infer<typeof AddDeviceSchema>;

export const UpdateDeviceSchema = z.object({
  name: z.string().min(1, "Tên thiết bị không được để trống.").optional(),
  description: z.string().optional(),
  roomId: z.string().min(1, "Phòng không được để trống.").optional(),
  mode: z
    .enum(["auto", "manual"], {
      message: "Chế độ phải là 'auto' hoặc 'manual'.",
    })
    .optional(),
});

export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;

export const SendCommandSchema = z.object({
  action: z.enum(["on", "off"], { message: "Action phải là 'on' hoặc 'off'." }),
});

export type SendCommandInput = z.infer<typeof SendCommandSchema>;

export const VoiceCommandSchema = z.object({
  text: z.string().min(1, "Nội dung lệnh không được để trống."),
});

export type VoiceCommandInput = z.infer<typeof VoiceCommandSchema>;

export default model<IDeviceDoc>("Device", DeviceSchema);
