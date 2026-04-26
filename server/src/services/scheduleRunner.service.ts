import DeviceActionSchedule from "../models/DeviceActionScheduleSchema";
import { IDeviceDoc } from "../models/DeviceSchema";
import ActionLog from "../models/ActionLogSchema";
import mqttService from "./mqttService";

const WEEKDAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DeviceType = IDeviceDoc["type"];

class ScheduleRunnerService {
  private timer: NodeJS.Timeout | null = null;
  private isTickRunning = false;
  private readonly executedAtMinute = new Set<string>();

  start(): void {
    if (this.timer) {
      return;
    }

    console.log("[ScheduleRunner] Started. Checking schedules every minute.");
    this.scheduleNextTick();
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
    this.isTickRunning = false;
    this.executedAtMinute.clear();
    console.log("[ScheduleRunner] Stopped.");
  }

  private scheduleNextTick(): void {
    const now = Date.now();
    const delayToNextMinute = 60_000 - (now % 60_000);

    this.timer = setTimeout(() => {
      this.runTickSafely()
        .catch((err) => {
          console.error("[ScheduleRunner] Tick failed:", err);
        })
        .finally(() => {
          if (this.timer !== null) {
            this.scheduleNextTick();
          }
        });
    }, delayToNextMinute);
  }

  private async runTickSafely(): Promise<void> {
    if (this.isTickRunning) {
      console.warn("[ScheduleRunner] Previous tick is still running, skip.");
      return;
    }

    this.isTickRunning = true;
    try {
      await this.tick();
    } finally {
      this.isTickRunning = false;
    }
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    const currentDay = WEEKDAY_MAP[now.getDay()];
    const minuteKey = this.getMinuteKey(now);

    const schedules = await DeviceActionSchedule.find({
      active: true,
      triggerTime: currentTime,
    }).populate("deviceId", "name key type");

    if (schedules.length === 0) {
      this.pruneExecutionCache(minuteKey);
      return;
    }

    for (const schedule of schedules) {
      const executionKey = `${schedule._id.toString()}-${minuteKey}`;
      if (this.executedAtMinute.has(executionKey)) {
        continue;
      }

      const shouldRunOnDay =
        !schedule.repeatDays?.length ||
        schedule.repeatDays.includes(currentDay);
      if (!shouldRunOnDay) {
        continue;
      }

      const device = schedule.deviceId as unknown as {
        _id: string;
        name: string;
        key: string;
        type: DeviceType;
      };

      if (!device?.key) {
        console.warn(
          `[ScheduleRunner] Skip schedule ${schedule._id.toString()} because device is missing.`,
        );
        continue;
      }

      if (!schedule.action) {
        console.warn(
          `[ScheduleRunner] Skip schedule ${schedule._id.toString()} because action is missing.`,
        );
        continue;
      }

      const payload = this.mapActionToPayload(device.type, schedule.action);

      try {
        mqttService.publish(device.key, payload);
        this.executedAtMinute.add(executionKey);

        await ActionLog.create({
          deviceId: device._id,
          action: `${schedule.action} (${payload})`,
          actor: "Schedule",
        });

        console.log(
          `[ScheduleRunner] Executed ${schedule.action} for ${device.name} (${device.type}) with payload ${payload}.`,
        );
      } catch (err) {
        console.error(
          `[ScheduleRunner] Failed to execute schedule ${schedule._id.toString()}:`,
          err,
        );
      }
    }

    this.pruneExecutionCache(minuteKey);
  }

  private mapActionToPayload(type: DeviceType, action: "on" | "off"): string {
    if (type === "fanDevice") {
      return action === "on" ? "100" : "0";
    }

    if (type === "lightDevice" || type === "doorDevice") {
      return action === "on" ? "1" : "0";
    }

    return action === "on" ? "1" : "0";
  }

  private getMinuteKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}-${hour}-${minute}`;
  }

  private pruneExecutionCache(currentMinuteKey: string): void {
    for (const key of this.executedAtMinute) {
      if (!key.endsWith(currentMinuteKey)) {
        this.executedAtMinute.delete(key);
      }
    }
  }
}

const scheduleRunnerService = new ScheduleRunnerService();

export default scheduleRunnerService;
