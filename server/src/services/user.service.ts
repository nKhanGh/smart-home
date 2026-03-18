import { ServiceError } from "../errors/service.error";
import User, { AddUserInput } from "../models/UserSchema";
import bcrypt from "bcryptjs";

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
      avatarColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
      avatarInitials: fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    });

    return { userId: user._id };
  }
}

const userService = new UserService();

export default userService;