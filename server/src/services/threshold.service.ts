import Threshold, {
  CreateThresholdInput,
  UpdateThresholdInput,
} from "../models/ThresholdSchema";
import Device, { IDeviceDoc } from "../models/DeviceSchema";
import { ServiceError } from "../errors/service.error";

export class ThresholdService {
  private isSensorType(type: string): boolean {
    return ["lightSensor", "temperatureSensor", "humiditySensor"].includes(
      type,
    );
  }

  private assertCompatibleThreshold(
    device: IDeviceDoc,
    sensor: IDeviceDoc,
    action: "on" | "off" | "alert",
  ) {
    if (!this.isSensorType(sensor.type)) {
      throw new ServiceError(400, "sensorId phải là thiết bị cảm biến.");
    }

    if (device.roomId.toString() !== sensor.roomId.toString()) {
      throw new ServiceError(
        400,
        "Thiết bị điều khiển và cảm biến phải cùng phòng.",
      );
    }

    if (device.type.endsWith("Sensor")) {
      if (action !== "alert") {
        throw new ServiceError(
          400,
          "Thiết bị cảm biến chỉ hỗ trợ threshold với action 'alert'.",
        );
      }

      if (device._id.toString() !== sensor._id.toString()) {
        throw new ServiceError(
          400,
          "Thiết bị cảm biến phải dùng chính nó làm sensorId.",
        );
      }

      return;
    }

    const sensorByAction: Partial<Record<"on" | "off" | "alert", string[]>> =
      (() => {
        switch (device.type) {
          case "lightDevice":
            return {
              on: ["lightSensor"],
              off: ["lightSensor"],
              alert: ["lightSensor", "temperatureSensor"],
            };
          case "fanDevice":
            return {
              on: ["temperatureSensor", "humiditySensor"],
              off: ["temperatureSensor", "humiditySensor"],
              alert: ["temperatureSensor", "humiditySensor"],
            };
          case "doorDevice":
            return {
              alert: ["lightSensor"],
            };
          default:
            return {};
        }
      })();

    const allowedSensors = sensorByAction[action] || [];
    if (allowedSensors.length === 0) {
      throw new ServiceError(
        400,
        `Loại thiết bị ${device.type} không hỗ trợ action '${action}' cho threshold.`,
      );
    }

    if (!allowedSensors.includes(sensor.type)) {
      throw new ServiceError(
        400,
        `Thiết bị ${device.type} với action '${action}' không hỗ trợ cảm biến ${sensor.type}.`,
      );
    }
  }

  async createThreshold(
    deviceId: string,
    payload: CreateThresholdInput,
    createdBy?: string,
  ) {
    const [device, sensor] = await Promise.all([
      Device.findOne({ _id: deviceId }),
      Device.findOne({ _id: payload.sensorId }),
    ]);

    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    if (!sensor) {
      throw new ServiceError(404, "Sensor not found.");
    }

    this.assertCompatibleThreshold(device, sensor, payload.action);

    return Threshold.create({
      deviceId: device._id,
      sensorId: sensor._id,
      value: payload.value,
      when: payload.when,
      action: payload.action,
      updatedBy: createdBy || "unknown",
    });
  }

  async getThreshold(deviceId: string) {
    const device = await Device.findOne({ _id: deviceId });
    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }

    const thresholds = await Threshold.find({ deviceId: device._id }).sort({
      createdAt: -1,
    });
    if (thresholds.length === 0) {
      throw new ServiceError(404, "Threshold not found.");
    }

    return thresholds;
  }

  async updateThreshold(
    thresholdId: string,
    payload: UpdateThresholdInput,
    updatedBy?: string,
  ) {
    const threshold = await Threshold.findById(thresholdId);
    if (!threshold) {
      throw new ServiceError(404, "Threshold not found.");
    }

    const [device, sensor] = await Promise.all([
      Device.findById(threshold.deviceId),
      Device.findOne({ _id: payload.sensorId }),
    ]);

    if (!device) {
      throw new ServiceError(404, "Device not found.");
    }
    if (!sensor) {
      throw new ServiceError(404, "Sensor not found.");
    }

    this.assertCompatibleThreshold(device, sensor, payload.action);

    threshold.sensorId = sensor._id;
    threshold.value = payload.value;
    threshold.when = payload.when;
    threshold.action = payload.action;
    threshold.updatedAt = new Date();
    threshold.updatedBy = updatedBy || "unknown";
    await threshold.save();

    return threshold;
  }

  async deleteThreshold(thresholdId: string) {
    const threshold = await Threshold.findByIdAndDelete(thresholdId);
    if (!threshold) {
      throw new ServiceError(404, "Threshold not found.");
    }

    return threshold;
  }
}

const thresholdService = new ThresholdService();

export default thresholdService;
