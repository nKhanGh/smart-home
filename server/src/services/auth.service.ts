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

  async introspect(token: string) {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    try {
      const payload = jwt.verify(token, secret) as { id: string; username: string; role: string };
      return { valid: true, payload };
    } catch (err) {
      console.log(err);
      return { valid: false, payload: null };
    }
  }

  async login(payload: LoginInput) {
    const { username, password } = payload;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ServiceError(401, "Sai tên đăng nhập hoặc mật khẩu.");
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const signOptionsAccess: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as number | undefined) || "1h",
    };

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, type: "access" },
      secret,
      signOptionsAccess,
    );

    const signOptionsRefresh: SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as number | undefined) || "2h",
    };

    const refreshToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role, type: "refresh" },
      secret,
      signOptionsRefresh,
    );

    return {
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    try {
      const payload = jwt.verify(token, secret) as { id: string; username: string; role: string; type: string };
      if (payload.type !== "refresh") {
        throw new ServiceError(400, "Invalid token type.");
      }
      const accessSignOptions: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN as number | undefined) || "1h",
      };
      const newToken = jwt.sign(
        { id: payload.id, username: payload.username, role: payload.role, type: "access" },
        secret,
        accessSignOptions,
      );

      const refreshSignOptions: SignOptions = {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as number | undefined) || "2h",
      };
      const newRefreshToken = jwt.sign(
        { id: payload.id, username: payload.username, role: payload.role, type: "refresh" },
        secret,
        refreshSignOptions,
      );
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new ServiceError(401, "Invalid refresh token.");
    }
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
