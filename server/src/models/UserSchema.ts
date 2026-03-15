import { Schema, model, Document } from "mongoose";
import z from "zod";

export interface IUserDoc extends Document {
  username     : string;
  password_hash: string;
  full_name    : string;
  role         : "admin" | "user";
  avatar_color: string;
  avatar_initials: string;
}

const UserSchema = new Schema<IUserDoc>({
  username     : { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  full_name    : { type: String, required: true },
  role         : { type: String, enum: ["admin", "user"], default: "user" },
  avatar_color: { type: String, default: "#000000" },
  avatar_initials: { type: String, default: "" }
}, { timestamps: true });

export const RegisterSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  full_name: z.string().min(1, "Họ tên không được để trống.")
});

export const LoginSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
});

export default model<IUserDoc>("User", UserSchema);
