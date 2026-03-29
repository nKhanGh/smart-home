import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";
import mqttService from "./services/mqttService";
// import { seedDefaults } from "./models/SystemConfigSchema";

const PORT = process.env.PORT ?? 3000;

const bootstrap = async (): Promise<void> => {
  await connectDB();
  // await seedDefaults();

  // Kết nối MQTT đến Adafruit IO
  // Yolo:Bit cũng subscribe/publish lên đây trực tiếp — không cần gateway
  mqttService.connect();
  await mqttService.subscribeAllDeviceFeeds();

  app.listen(PORT, () =>
    console.log(`[Server] Đang chạy tại http://localhost:${PORT}`));
  app.listen(3000, '0.0.0.0');
};

bootstrap().catch((err) => {
  console.error("[Server] Khởi động thất bại:", err);
  process.exit(1);
});
