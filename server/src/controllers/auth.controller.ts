import { Request, Response } from "express";
import { AuthRequest } from "../types";
import authService, { AuthService } from "../services/auth.service";
import { LoginInput, RegisterInput } from "../models/UserSchema";
import handleControllerError from "../utils/handleControllerError";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  private getBearerToken(req: Request): string | null {
    const header = req.headers["authorization"];
    if (!header) {
      return null;
    }
    return header.startsWith("Bearer ") ? header.slice(7) : header;
  }

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

  introspect = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.body.token;
      const result = await this.service.introspect(token);
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error introspecting token:");
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.body.token;
      const result = await this.service.refreshToken(token);
      res.status(200).json({ code: "200", ...result });
    } catch (err) {
      handleControllerError(err, res, "Error refreshing token:");
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.login(req.body as LoginInput);
      console.log("Login successful for user:", result);
      res.status(200).json({
        code: "200",
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
      });
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

  logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const token = this.getBearerToken(req);
      if (!token) {
        res.status(401).json({ code: "401", msg: "Không có token." });
        return;
      }

      const pushToken = req.body?.pushToken as string | undefined;
      await this.service.logout(token, req.user?.id, pushToken);
      res.status(200).json({ code: "200", msg: "Đăng xuất thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error logging out:");
    }
  };
}

const authController = new AuthController(authService);

export default authController;
