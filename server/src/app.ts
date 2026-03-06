import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes   from "./routes/auth";
import deviceRoutes from "./routes/devices";
import roomRoutes   from "./routes/rooms";
import configRoutes from "./routes/config";

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
app.use("/api/auth",    authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/rooms",   roomRoutes);
app.use("/api/config",  configRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) =>
  res.json({ status: "ok", message: "Smart Home Backend đang chạy." }));

// ─── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ code: "404", msg: "Endpoint không tồn tại." }));

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ code: "500", msg: "Lỗi server.", error: err.message });
});

export default app;
