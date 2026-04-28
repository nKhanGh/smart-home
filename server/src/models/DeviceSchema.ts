import { Schema, model, Document, Types } from "mongoose";
import z from "zod";

export interface IDeviceDoc extends Document {
  name: string;
  description: string;
  key: string;
  mode: "auto" | "manual";
  roomId: Types.ObjectId;
  type:
    | "lightSensor"
    | "temperatureSensor"
    | "humiditySensor"
    | "motionSensor"
    | "device"
    | "threshold"
    | "lightDevice"
    | "doorDevice"
    | "fanDevice";
  createdBy: Types.ObjectId;
  password: string;
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
      enum: [
        "lightSensor",
        "temperatureSensor",
        "humiditySensor",
        "motionSensor",
        "device",
        "threshold",
        "lightDevice",
        "doorDevice",
        "fanDevice",
      ],
    },
    password: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// export const AddDeviceSchema = z.object({
//   name: z.string().min(1, "Tên thiết bị không được để trống."),
//   description: z.string().optional(),
//   roomId: z.string().min(1, "Phòng không được để trống."),
//   type: z.enum(
//     ["lightSensor", "temperatureSensor", "humiditySensor", "device", "threshold"],
//     { message: "Loại thiết bị không hợp lệ." },
//   ),
// });

export const UpdateDeviceSchema = z.object({
  name: z.string().min(1, "Tên thiết bị không được để trống.").optional(),
  description: z.string().optional(),
});

export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;

export const SendCommandSchema = z.object({
  action: z.string().min(1, "Hành động không được để trống."),
  password: z.string().optional(),
});

export type SendCommandInput = z.infer<typeof SendCommandSchema>;

export const UpdateDevicePasswordSchema = z.object({
  newPassword: z.string().min(1, "Mật khẩu mới không được để trống."),
  oldPassword: z.string().optional(),
});

export type UpdateDevicePasswordInput = z.infer<
  typeof UpdateDevicePasswordSchema
>;

export const VoiceCommandSchema = z.object({
  text: z.string().min(1, "Nội dung lệnh không được để trống."),
});

export type VoiceCommandInput = z.infer<typeof VoiceCommandSchema>;

export default model<IDeviceDoc>("Device", DeviceSchema);
