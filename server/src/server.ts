import "dotenv/config";
import app from "./app";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db";
import mqttService from "./services/mqttService";
// import { seedDefaults } from "./models/SystemConfigSchema";
// import { startScheduler } from "./services/schedule.service";

const PORT = process.env.PORT ?? 3000;

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client kết nối: ${socket.id}`);
    socket.on("disconnect", () =>
      console.log(`[Socket] Client ngắt kết nối: ${socket.id}`)
    );
  });

  mqttService.setIO(io);
  mqttService.connect();
  await mqttService.subscribeAllDeviceFeeds();

  httpServer.listen(PORT, () =>
    console.log(`[Server] Đang chạy tại http://localhost:${PORT}`));
};

bootstrap().catch((err) => {
  console.error("[Server] Khởi động thất bại:", err);
  process.exit(1);
});
