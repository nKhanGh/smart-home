import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";
import { getRedisClient } from "../config/redis";
import User from "../models/UserSchema";

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
    if (redis) {
      const isBlacklisted = await redis.exists(`auth:blacklist:token:${token}`);
      if (isBlacklisted) {
        res.status(401).json({ code: "401", msg: "Token đã bị thu hồi." });
        return;
      }
    }

    try {
      req.user = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await User.findById(req.user.id).select("isActive");
      if (!user) {
        res.status(401).json({ code: "401", msg: "Người dùng không tồn tại." });
        return;
      }
      if (!user.isActive) {
        res
          .status(403)
          .json({ code: "403", msg: "Tài khoản của bạn đã bị vô hiệu hóa." });
        return;
      }
      req.user.isActive = user.isActive;
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ code: "401", msg: "Không có token." });
      return;
    }

    const user = await User.findById(req.user.id).select("role");
    if (!user) {
      res.status(401).json({ code: "401", msg: "Người dùng không tồn tại." });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        code: "403",
        msg: "Bạn không có quyền thực hiện hành động này.",
      });
      return;
    }
    req.user.role = user.role;
    console.log("User role passed:", user.role);
    next();
  };
