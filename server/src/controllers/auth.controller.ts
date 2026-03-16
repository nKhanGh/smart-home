import { Request, Response } from "express";
import { AuthRequest } from "../types";
import authService, {
  AuthService,
  AuthServiceError,
} from "../services/auth.service";
import { LoginInput, RegisterInput } from "../models/UserSchema";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.register(req.body as RegisterInput);
      res
        .status(201)
        .json({
          code: "201",
          msg: "Đăng ký thành công.",
          userId: result.userId,
        });
    } catch (err) {
      if (err instanceof AuthServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.login(req.body as LoginInput);
      res
        .status(200)
        .json({ code: "200", token: result.token, user: result.user });
    } catch (err) {
      if (err instanceof AuthServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };

  getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await this.service.getMe(req.user?.id);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof AuthServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const authController = new AuthController(authService);

export default authController;
