import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers["authorization"];
  if (!header) {
    res.status(401).json({ code: "401", msg: "Không có token." });
    return;
  }
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ code: "401", msg: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
