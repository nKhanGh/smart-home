import { Schema, model, Document } from "mongoose";

export interface ISystemConfigDoc extends Document {
  config_key  : string;
  config_value: string;
}

const SystemConfigSchema = new Schema<ISystemConfigDoc>({
  config_key  : { type: String, required: true, unique: true },
  config_value: { type: String, required: true },
}, { timestamps: true });

const SystemConfig = model<ISystemConfigDoc>("SystemConfig", SystemConfigSchema);

// Giá trị mặc định nếu DB chưa có
const seedDefaults = async (): Promise<void> => {
  const defaults: Record<string, string> = {
    temp_alert_threshold: "35",
    light_mode          : "AUTO",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await SystemConfig.findOneAndUpdate(
      { config_key: key },
      { $setOnInsert: { config_value: value } },
      { upsert: true, new: false }
    );
  }
};

export { SystemConfig, seedDefaults };
