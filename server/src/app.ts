import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import deviceRoutes from "./routes/devices.route";
import roomRoutes from "./routes/rooms.route";
import thresholdRoutes from "./routes/threshold.route";
import scheduleRoutes from "./routes/schedules.route";
import sensorAlertRoutes from "./routes/sensorAlerts.route";
import dataRoutes from "./routes/data.route";
import userRoutes from "./routes/user.route";
import homeDisplayRoutes from "./routes/homeDisplay.route";
import statisticRoutes from "./routes/statistic.route";
// import configRoutes from "./routes/config";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/devices/:id/threshold", thresholdRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/sensor-alerts", sensorAlertRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/users", userRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/home-display", homeDisplayRoutes);
app.use("/api/statistics", statisticRoutes);

app.get("/", (_req, res) =>
  res.json({ status: "ok", message: "Smart Home Backend đang chạy." }),
);

// ─── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ code: "404", msg: "Endpoint không tồn tại." }),
);

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ code: "500", msg: "Lỗi server.", error: err.message });
});

export default app;
