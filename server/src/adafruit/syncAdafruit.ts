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
  else if (key.endsWith("-light") || key.endsWith("-plug"))
    return "lightDevice";
  else if (key.endsWith("-door")) return "doorDevice";
  else if (key.endsWith("-fan")) return "fanDevice";
  return "device";
};

const dropLegacyThresholdIndex = async () => {
  const indexes = await Threshold.collection.indexes();
  const hasLegacy = indexes.some((idx) => idx.name === "deviceId_1");
  if (!hasLegacy) return;

  await Threshold.collection.dropIndex("deviceId_1");
  console.log("[Sync] Đã drop legacy index: deviceId_1");
};

const ensureDefaultSensorThreshold = async (
  sensorDeviceId: Types.ObjectId,
  adminUserId: string,
) => {
  const defaultRules: Array<{ when: "above" | "below"; action: "alert" }> = [
    { when: "above", action: "alert" },
    { when: "below", action: "alert" },
  ];

  for (const rule of defaultRules) {
    await Threshold.findOneAndUpdate(
      {
        deviceId: sensorDeviceId,
        sensorId: sensorDeviceId,
        when: rule.when,
        action: rule.action,
      },
      {
        $setOnInsert: {
          deviceId: sensorDeviceId,
          sensorId: sensorDeviceId,
          when: rule.when,
          action: rule.action,
          value: 0,
        },
        $set: {
          updatedBy: new Types.ObjectId(adminUserId),
        },
      },
      { upsert: true, new: true },
    );
  }

  const defaultRuleCount = await Threshold.countDocuments({
    deviceId: sensorDeviceId,
    sensorId: sensorDeviceId,
    action: "alert",
    when: { $in: ["above", "below"] },
  });

  if (defaultRuleCount < 2) {
    throw new Error(
      `[Sync] Sensor ${sensorDeviceId.toString()} chưa đủ 2 threshold mặc định (above/below). ` +
        "Hãy kiểm tra index cũ deviceId_1 hoặc dữ liệu trùng bất thường.",
    );
  }
};

const syncThresholdsFromExistingDevices = async (adminUserId: string) => {
  const sensors = await Device.find({
    type: { $in: ["temperatureSensor", "humiditySensor", "lightSensor"] },
  }).select("_id key name type");

  for (const sensor of sensors) {
    await ensureDefaultSensorThreshold(sensor._id, adminUserId);
    console.log(
      `[Sync] Threshold defaults synced for sensor: ${sensor.key} (${sensor.type})`,
    );
  }

  console.log(
    `[Sync] Hoàn tất tạo lại threshold cho ${sensors.length} cảm biến trong DB.`,
  );
};

const sync = async () => {
  await connectDB();
  await dropLegacyThresholdIndex();

  const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
  if (!ADMIN_USER_ID) {
    console.error("[Sync] ADMIN_USER_ID không được cấu hình.");
    process.exit(1);
  }

  const thresholdOnlyMode =
    process.argv.includes("--threshold-only") ||
    process.env.SYNC_THRESHOLDS_ONLY === "1";

  if (thresholdOnlyMode) {
    await syncThresholdsFromExistingDevices(ADMIN_USER_ID);
    process.exit(0);
  }

  const { data: groups } = await adafruitAPI.get("/groups");

  for (const group of groups) {
    if (group.name === "Default") continue;
    let room = await Room.findOne({ key: group.key });
    if (!room) {
      room = await Room.create({
        name:
          group.name.split("_").join(" ").trim().toLowerCase() || group.name,
        key: group.key,
      });
      console.log(`[Sync] Room created: ${room.name}`);
    }

    const { data: feeds } = await adafruitAPI.get(`/groups/${group.key}/feeds`);

    for (const feed of feeds) {
      const exists = await Device.findOne({ key: feed.key });
      if (exists) {
        console.log(`[Sync] Skip (exists): ${feed.key}`);
        if (exists.type.endsWith("Sensor")) {
          await ensureDefaultSensorThreshold(exists._id, ADMIN_USER_ID);
        }
        continue;
      }

      const device = await Device.create({
        name:
          feed.name?.split("_").slice(1).join(" ").trim().toLowerCase() ||
          feed.key,
        description: feed.description ?? "",
        key: feed.key,
        roomId: room._id,
        type: getType(feed.key),
        password:
          getType(feed.key) === "doorDevice" ? bcrypt.hash("123456", 10) : "",
      });

      if (device.type.endsWith("Sensor")) {
        await ensureDefaultSensorThreshold(device._id, ADMIN_USER_ID);
      }

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
