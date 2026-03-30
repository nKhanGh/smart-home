import { ServiceError } from "../errors/service.error";
import HomeDisplay, {
  CreateHomeDisplayInput,
  UpdateHomeDisplayInput,
} from "../models/HomeDisplaySchema";
import Device from "../models/DeviceSchema";
import deviceService from "./device.service";

export class HomeDisplayService {
  async createHomeDisplay(userId: string, input: CreateHomeDisplayInput) {
    const existing = await HomeDisplay.findOne({ userId });
    if (existing) {
      throw new ServiceError(400, "Home display for this user already exists.");
    }
    const homeDisplay = await HomeDisplay.create({ ...input, userId });
    return homeDisplay;
  }

  async getHomeDisplayByUserId(userId: string) {
    const homeDisplay = await HomeDisplay.findOne({ userId }).populate([
      { path: "tempId", populate: { path: "roomId", select: "name _id" } },
      { path: "briId", populate: { path: "roomId", select: "name _id" } },
      { path: "humId", populate: { path: "roomId", select: "name _id" } },
    ]);

    if (!homeDisplay) {
      throw new ServiceError(404, "Home display not found for this user.");
    }

    const tempDevice = homeDisplay.tempId as any;
    const briDevice = homeDisplay.briId as any;
    const humDevice = homeDisplay.humId as any;

    const tempData = await deviceService.getCurrentData(
      tempDevice._id.toString(),
    );
    const briData = await deviceService.getCurrentData(
      briDevice._id.toString(),
    );
    const humData = await deviceService.getCurrentData(
      humDevice._id.toString(),
    );

    const instantDevices = await Device.find({
      _id: { $in: homeDisplay.instantControl },
    }).populate("roomId", "name");

    const instantControl = await Promise.all(
      instantDevices.map(async (device) => {
        const actionLog = await deviceService.getCurrentAction(
          device._id.toString(),
        );
        return {
          name: device.name || "",
          roomName: (device.roomId as any)?.name || "",
          roomId: (device.roomId as any)?._id.toString() || "",
          type: "device" as const,
          currentAction: actionLog?.action || "",
        };
      }),
    );

    const response = {
      userId,
      temp: {
        deviceId: tempDevice._id.toString(),
        roomName: tempDevice?.roomId?.name || "",
        type: "temperatureSensor",
        currentData: tempData?.value || null,
        roomId: (tempDevice?.roomId)?._id.toString() || "",
      },
      bri: {
        deviceId: briDevice._id.toString(),
        roomName: briDevice?.roomId?.name || "",
        type: "lightSensor",
        currentData: briData?.value || null,
        roomId: (briDevice?.roomId)?._id.toString() || "",
      },
      hum: {
        deviceId: humDevice._id.toString(),
        roomName: humDevice?.roomId?.name || "",
        type: "humiditySensor",
        currentData: humData?.value || null,
        roomId: (humDevice?.roomId)?._id.toString() || "",
      },
      instantControl,
    };

    console.log("Home display response:", response);

    return response;
  }

  async updateHomeDisplay(userId: string, input: UpdateHomeDisplayInput) {
    const homeDisplay = await HomeDisplay.findOneAndUpdate({ userId }, input, {
      new: true,
    }).populate("tempId briId humId");
    if (!homeDisplay) {
      throw new ServiceError(404, "Home display not found for this user.");
    }
    return homeDisplay;
  }
}

const homeDisplayService = new HomeDisplayService();

export default homeDisplayService;
