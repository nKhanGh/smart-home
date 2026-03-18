import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import User, { AddUserInput, LoginInput, RegisterInput } from "../models/UserSchema";
import { ServiceError } from "../errors/service.error";

export class AuthService {
  async register(payload: RegisterInput) {
    const { username, password, fullName } = payload;

    if (await User.findOne({ username })) {
      throw new ServiceError(400, "Username đã tồn tại.");
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hash,
      fullName,
      role: "admin",
      avatarColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
      avatarInitials: fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    });

    return { userId: user._id };
  }

  async login(payload: LoginInput) {
    const { username, password } = payload;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ServiceError(401, "Sai tên đăng nhập hoặc mật khẩu.");
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as number | undefined) || 7,
    };

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secret,
      signOptions,
    );

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  

  async getMe(userId?: string) {
    const user = await User.findById(userId, { passwordHash: 0 });
    if (!user) {
      throw new ServiceError(404, "User not found.");
    }
    return user;
  }
}

const authService = new AuthService();

export default authService;
