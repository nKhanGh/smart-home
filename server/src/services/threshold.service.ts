import Threshold, { UpdateThresholdInput } from "../models/ThresholdSchema";
import Device from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";

export class ThresholdService {
  async getThreshold(deviceId: string) {
    const device = await Device.findOne({ _id: deviceId });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const threshold = await Threshold.findOne({ deviceId: device._id });
    if (!threshold) {
      throw new ServiceError(404, "Threshold not found.");
    }

    return threshold;
  }

  async updateThreshold(
    deviceId: string,
    payload: UpdateThresholdInput,
    updatedBy?: string,
  ) {
    const device = await Device.findOne({ _id: deviceId });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    let threshold = await Threshold.findOne({ deviceId: device._id });
    if (threshold) {
      threshold.value = payload.value;
      threshold.updatedAt = new Date();
      threshold.updatedBy = updatedBy || "unknown";
      await threshold.save();
    } else {
      threshold = await Threshold.create({
        deviceId: device._id,
        value: payload.value,
      });
    }

    return threshold;
  }
}

const thresholdService = new ThresholdService();

export default thresholdService;
