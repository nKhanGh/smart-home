import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";
import { getRedisClient } from "../config/redis";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers["authorization"];
  if (!header) {
    res.status(401).json({ code: "401", msg: "Không có token." });
    return Promise.resolve();
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  return (async () => {
    const redis = await getRedisClient();
    if (!redis) {
      res
        .status(503)
        .json({ code: "503", msg: "Redis chưa sẵn sàng để xác thực token." });
      return;
    }

    const isBlacklisted = await redis.exists(`auth:blacklist:token:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ code: "401", msg: "Token đã bị thu hồi." });
      return;
    }

    try {
      req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
      next();
    } catch {
      res
        .status(401)
        .json({ code: "401", msg: "Token không hợp lệ hoặc đã hết hạn." });
    }
  })();
};

export const authorizeRoles =
  (allowedRoles: Array<"admin" | "user">) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ code: "401", msg: "Không có token." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res
        .status(403)
        .json({
          code: "403",
          msg: "Bạn không có quyền thực hiện hành động này.",
        });
      return;
    }

    next();
  };
