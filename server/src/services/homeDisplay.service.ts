import { ServiceError } from "../errors/service.error";
import HomeDisplay, {
  CreateHomeDisplayInput,
  UpdateHomeDisplayInput,
} from "../models/HomeDisplaySchema";
import Device from "../models/DeviceSchema";
import deviceService from "./device.service";

export class HomeDisplayService {
  private async findDefaultHomeDisplayDevices() {
    const [tempDevice, briDevice, humDevice] = await Promise.all([
      Device.findOne({ type: "temperatureSensor" }).select("_id"),
      Device.findOne({ type: "lightSensor" }).select("_id"),
      Device.findOne({ type: "humiditySensor" }).select("_id"),
    ]);

    if (!tempDevice || !briDevice || !humDevice) {
      return null;
    }

    return {
      tempId: tempDevice._id,
      briId: briDevice._id,
      humId: humDevice._id,
    };
  }

  async ensureDefaultHomeDisplay(userId: string) {
    const existing = await HomeDisplay.findOne({ userId });
    if (existing) {
      return existing;
    }

    const defaultDevices = await this.findDefaultHomeDisplayDevices();
    if (!defaultDevices) {
      return null;
    }

    return HomeDisplay.create({
      userId,
      ...defaultDevices,
      instantControl: [],
    });
  }

  async createHomeDisplay(userId: string, input: CreateHomeDisplayInput) {
    const existing = await HomeDisplay.findOne({ userId });
    if (existing) {
      throw new ServiceError(400, "Home display for this user already exists.");
    }
    const homeDisplay = await HomeDisplay.create({ ...input, userId });
    return homeDisplay;
  }

  async getHomeDisplayByUserId(userId: string) {
    let homeDisplay = await HomeDisplay.findOne({ userId }).populate([
      { path: "tempId", populate: { path: "roomId", select: "name _id" } },
      { path: "briId", populate: { path: "roomId", select: "name _id" } },
      { path: "humId", populate: { path: "roomId", select: "name _id" } },
    ]);

    if (!homeDisplay) {
      const created = await this.ensureDefaultHomeDisplay(userId);
      if (!created) {
        throw new ServiceError(404, "Home display not found for this user.");
      }

      homeDisplay = await HomeDisplay.findById(created._id).populate([
        { path: "tempId", populate: { path: "roomId", select: "name _id" } },
        { path: "briId", populate: { path: "roomId", select: "name _id" } },
        { path: "humId", populate: { path: "roomId", select: "name _id" } },
      ]);

      if (!homeDisplay) {
        throw new ServiceError(404, "Home display not found for this user.");
      }
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
          id: device._id.toString(),
          name: device.name || "",
          roomName: (device.roomId as any)?.name || "",
          roomId: (device.roomId as any)?._id.toString() || "",
          type: device.type,
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
        roomId: tempDevice?.roomId?._id.toString() || "",
      },
      bri: {
        deviceId: briDevice._id.toString(),
        roomName: briDevice?.roomId?.name || "",
        type: "lightSensor",
        currentData: briData?.value || null,
        roomId: briDevice?.roomId?._id.toString() || "",
      },
      hum: {
        deviceId: humDevice._id.toString(),
        roomName: humDevice?.roomId?.name || "",
        type: "humiditySensor",
        currentData: humData?.value || null,
        roomId: humDevice?.roomId?._id.toString() || "",
      },
      instantControl,
    };

    console.log("Home display response:", response);

    return response;
  }

  async updateHomeDisplay(userId: string, input: UpdateHomeDisplayInput) {
    const updateData: any = {
      ...input,
      updatedAt: new Date(),
    };

    if (input.instantControl != null && input.instantControl.length > 0) {
      updateData.instantControl = input.instantControl;
    } else {
      delete updateData.instantControl;
    }

    const homeDisplay = await HomeDisplay.findOneAndUpdate(
      { userId },
      updateData,
      { new: true },
    ).populate("tempId briId humId");

    if (!homeDisplay) {
      throw new ServiceError(404, "Home display not found for this user.");
    }
    return homeDisplay;
  }
}

const homeDisplayService = new HomeDisplayService();

export default homeDisplayService;
