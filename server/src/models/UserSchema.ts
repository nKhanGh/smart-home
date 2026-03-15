import { Schema, model, Document } from "mongoose";

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

export default model<IUserDoc>("User", UserSchema);
