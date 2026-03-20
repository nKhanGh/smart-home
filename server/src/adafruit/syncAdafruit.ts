import "dotenv/config";
import connectDB from "../config/db";
import { adafruitAPI } from "../adafruit";
import Device from "../models/DeviceSchema";
import Room   from "../models/RoomSchema";
import { Types } from "mongoose";

const sync = async () => {
  await connectDB();

  const { data: groups } = await adafruitAPI.get("/groups");

  const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
  if (!ADMIN_USER_ID) {
    console.error("[Sync] ADMIN_USER_ID không được cấu hình.");
    process.exit(1);
  }

  for (const group of groups) {

    let room = await Room.findOne({ key: group.key });
    if (!room) {
      room = await Room.create({ name: group.name, key: group.key, createdBy: new Types.ObjectId(ADMIN_USER_ID)  });
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
        name       : feed.name,
        description: feed.description ?? "",
        key        : feed.key,
        roomId       : room._id,
        createdBy: new Types.ObjectId(ADMIN_USER_ID)
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