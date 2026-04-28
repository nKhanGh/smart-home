import { Schema, model, Document } from "mongoose";
import z from "zod";

export interface IUserDoc extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: "admin" | "user";
  isActive: boolean;
  avatarColor: string;
  avatarInitials: string;
}

const UserSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isActive: { type: Boolean, default: true },
    avatarColor: { type: String, default: "#000000" },
    avatarInitials: { type: String, default: "" },
  },
  { timestamps: true },
);

export const RegisterSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  fullName: z.string().min(1, "Họ tên không được để trống."),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const IntrospectSchema = z.object({
  token: z.string().min(1, "Token không được để trống."),
});

export type IntrospectInput = z.infer<typeof IntrospectSchema>;

export const RefreshTokenSchema = z.object({
  token: z.string().min(1, "Refresh token không được để trống."),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const AddUserSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  fullName: z.string().min(1, "Họ tên không được để trống."),
  role: z.enum(["admin", "user"], {
    message: "Vai trò phải là 'admin' hoặc 'user'.",
  }),
});

export type AddUserInput = z.infer<typeof AddUserSchema>;

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(8, "Mật khẩu cũ phải có ít nhất 8 ký tự."),
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự."),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống.").optional(),
  username: z
    .string()
    .min(6, "Tên đăng nhập phải có ít nhất 6 ký tự.")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export default model<IUserDoc>("User", UserSchema);
