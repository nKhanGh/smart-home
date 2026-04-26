import { ServiceError } from "../errors/service.error";
import User, { AddUserInput } from "../models/UserSchema";
import bcrypt from "bcryptjs";
import homeDisplayService from "./homeDisplay.service";

export class UserService {
  async addUser(payload: AddUserInput) {
    const { username, password, fullName, role } = payload;

    if (await User.findOne({ username })) {
      throw new ServiceError(400, "Username đã tồn tại.");
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hash,
      fullName,
      role,
      avatarColor:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
      avatarInitials: fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });

    try {
      await homeDisplayService.ensureDefaultHomeDisplay(user._id.toString());
    } catch (err) {
      console.error("Không thể tạo HomeDisplay mặc định cho user mới:", err);
    }

    return { userId: user._id };
  }

  async deleteUser(id: string, currentUserId: string) {
    const user = await User.findById(id);
    const currentUser = await User.findById(currentUserId);
    if (!user) {
      throw new ServiceError(404, "User not found.");
    }
    if (currentUser?.role !== "admin") {
      throw new ServiceError(403, "Bạn không có quyền xóa người dùng.");
    }
    if (user._id.toString() === currentUserId) {
      throw new ServiceError(400, "Bạn không thể xóa chính mình.");
    }
    await user.deleteOne();
    return { code: "200", msg: "Xóa người dùng thành công." };
  }

  async getAllUsers() {
    return User.find({}, "-passwordHash").sort({ createdAt: -1 });
  }

  async getUserById(id: string) {
    const user = await User.findById(id, "-passwordHash");
    if (!user) {
      throw new ServiceError(404, "User not found.");
    }
    return user;
  }

  async updateUser(id: string, payload: Partial<AddUserInput>) {
    const user = await User.findById(id);
    if (!user) {
      throw new ServiceError(404, "User not found.");
    }
    if (payload.username && payload.username !== user.username) {
      if (await User.findOne({ username: payload.username })) {
        throw new ServiceError(400, "Username đã tồn tại.");
      }
      user.username = payload.username;
    }
    if (payload.password) {
      user.passwordHash = await bcrypt.hash(payload.password, 10);
    }
    if (payload.fullName) {
      user.fullName = payload.fullName;
      user.avatarInitials = payload.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (payload.role) {
      user.role = payload.role;
    }
    await user.save();
    return { code: "200", msg: "Cập nhật người dùng thành công." };
  }
}

const userService = new UserService();

export default userService;
