import { Request, Response } from "express";
import { AuthRequest } from "../types";
import authService, { AuthService } from "../services/auth.service";
import { AddUserInput, LoginInput, RegisterInput } from "../models/UserSchema";
import handleControllerError from "../utils/handleControllerError";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.register(req.body as RegisterInput);
      res.status(201).json({
        code: "201",
        msg: "Đăng ký thành công.",
        userId: result.userId,
      });
    } catch (err) {
      handleControllerError(err, res, "Error registering user:");
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.login(req.body as LoginInput);
      res
        .status(200)
        .json({ code: "200", token: result.token, user: result.user });
    } catch (err) {
      handleControllerError(err, res, "Error logging in:");
    }
  };

  getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await this.service.getMe(req.user?.id);
      res.status(200).json(user);
    } catch (err) {
      handleControllerError(err, res, "Error fetching current user:");
    }
  };
}

const authController = new AuthController(authService);

export default authController;
