import { Schema, model, Document } from "mongoose";

export interface IUserDoc extends Document {
  username     : string;
  password_hash: string;
  full_name    : string;
  role         : "admin" | "user";
}

const UserSchema = new Schema<IUserDoc>({
  username     : { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  full_name    : { type: String, required: true },
  role         : { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

export default model<IUserDoc>("User", UserSchema);
