import { Document, model, Schema, Types } from "mongoose";
import z from "zod";

interface TempDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "temperatureSensor";
}

interface BriDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "lightSensor";
}

interface HumDisplay {
  deviceId: string;
  currentData: string;
  roomName: string;
  roomId: string;
  type: "humiditySensor";
}

interface DeviceInstantControl {
  id: string;
  name: string;
  roomName: string;
  roomId: string;
  type: "device";
  currentAction: string | number;
}

export interface HomeDisplayResponse {
  userId: string;
  temp: TempDisplay;
  bri: BriDisplay;
  hum: HumDisplay;
  instantControl: DeviceInstantControl[];
}

export interface IHomeDisplay extends Document {
  userId: Types.ObjectId;
  tempId: Types.ObjectId;
  briId: Types.ObjectId;
  humId: Types.ObjectId;
  instantControl: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HomeDisplaySchema = new Schema<IHomeDisplay>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    tempId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    briId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    humId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    instantControl: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const CreateHomeDisplaySchema = z.object({
  // userId: z.string().min(1, "userId không được để trống."),
  tempId: z.string().min(1, "tempId không được để trống."),
  briId: z.string().min(1, "briId không được để trống."),
  humId: z.string().min(1, "humId không được để trống."),
  instantControl: z.array(z.string()).default([]),
});

export const UpdateHomeDisplaySchema = z.object({
  tempId: z.string().min(1, "tempId không được để trống.").optional(),
  briId: z.string().min(1, "briId không được để trống.").optional(),
  humId: z.string().min(1, "humId không được để trống.").optional(),
  instantControl: z.array(z.string()).default([]),
});

export type CreateHomeDisplayInput = z.infer<typeof CreateHomeDisplaySchema>;
export type UpdateHomeDisplayInput = z.infer<typeof UpdateHomeDisplaySchema>;

export default model<IHomeDisplay>("HomeDisplay", HomeDisplaySchema);