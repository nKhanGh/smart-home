import "dotenv/config";
import connectDB from "../config/db";
import { adafruitAPI } from "../adafruit";
import Device from "../models/DeviceSchema";
import Room from "../models/RoomSchema";
import Threshold from "../models/ThresholdSchema";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

const getType = (key: string) => {
  if (key.endsWith("-threshold")) return "threshold";
  else if (key.endsWith("-temp")) return "temperatureSensor";
  else if (key.endsWith("-hum")) return "humiditySensor";
  else if (key.endsWith("-bri")) return "lightSensor";
  else if (key.endsWith("-light") || key.endsWith("-plug")) return "lightDevice";
  else if (key.endsWith("-door")) return "doorDevice";
  else if (key.endsWith("-fan")) return "fanDevice";
  return "device";
};


const sync = async () => {
  await connectDB();

  const { data: groups } = await adafruitAPI.get("/groups");

  const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
  if (!ADMIN_USER_ID) {
    console.error("[Sync] ADMIN_USER_ID không được cấu hình.");
    process.exit(1);
  }

  for (const group of groups) {
    if (group.name === "Default") continue;
    let room = await Room.findOne({ key: group.key });
    if (!room) {
      room = await Room.create({
        name: group.name.split("_").join(" ").trim().toLowerCase() || group.name,
        key: group.key,
      });
      console.log(`[Sync] Room created: ${room.name}`);
    }

    const { data: feeds } = await adafruitAPI.get(`/groups/${group.key}/feeds`);

    for (const feed of feeds) {
      const exists = await Device.findOne({ key: feed.key });
      if (exists) {
        console.log(`[Sync] Skip (exists): ${feed.key}`);
        continue;
      }

      const device = await Device.create({
        name: feed.name?.split("_").slice(1).join(" ").trim().toLowerCase() || feed.key,
        description: feed.description ?? "",
        key: feed.key,
        roomId: room._id,
        type: getType(feed.key),
        password: getType(feed.key) === "doorDevice" ? bcrypt.hash("123456", 10) : "",
      });

      await Threshold.create({
        deviceId: device._id,
        value: 0,
        updatedBy: new Types.ObjectId(ADMIN_USER_ID),
      });

      room.devices.push(device._id as any);
      console.log(`[Sync] Device created: ${device.name}`);
    }

    await room.save();
  }

  console.log("[Sync] Hoàn tất.");
  process.exit(0);
};

sync().catch((err) => {
  console.error("[Sync] Lỗi:", err);
  process.exit(1);
});
