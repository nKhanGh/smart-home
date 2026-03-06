import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/UserSchema";
import { AuthRequest } from "../types";

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." }); return;
  }
  const { username, password, full_name, role } = req.body;
  try {
    if (await User.findOne({ username })) {
      res.status(400).json({ code: "400", msg: "Username đã tồn tại." }); return;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password_hash: hash, full_name, role });
    res.status(201).json({ code: "201", msg: "Đăng ký thành công.", userId: user._id });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({ code: "400", msg: "Dữ liệu không hợp lệ." }); return;
  }
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ code: "401", msg: "Sai tên đăng nhập hoặc mật khẩu." }); return;
    }
    const secret: string = process.env.JWT_SECRET || "your-secret-key";
    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as number | undefined) || 7 };
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secret,
      signOptions
    );
    res.status(200).json({
      code: "200", token,
      user: { id: user._id, username: user.username, full_name: user.full_name, role: user.role }
    });
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id, { password_hash: 0 });
    if (!user) { res.status(404).json({ code: "404", msg: "User not found." }); return; }
    res.status(200).json(user);
  } catch {
    res.status(500).json({ code: "500", msg: "Server Error." });
  }
};
