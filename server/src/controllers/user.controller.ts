import { AddUserInput, PushTokenInput } from "../models/UserSchema";
import userService, { UserService } from "../services/user.service";
import { AuthRequest } from "../types";
import handleControllerError from "../utils/handleControllerError";
import { Response } from "express";

export class UserController {
  constructor(private readonly service: UserService) {}

  addUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.addUser(req.body as AddUserInput);
      res.status(201).json({
        code: "201",
        msg: "Thêm người dùng thành công.",
        userId: result.userId,
      });
    } catch (err) {
      handleControllerError(err, res, "Error adding user:");
    }
  };

  deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.deleteUser(
        req.params.id,
        req.user?.id || "",
      );
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error deleting user:");
    }
  };

  getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await this.service.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      handleControllerError(err, res, "Error fetching users:");
    }
  };

  getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await this.service.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      handleControllerError(err, res, "Error fetching user:");
    }
  };

  updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.service.updateUser(req.params.id, req.body);
      res
        .status(200)
        .json({ code: "200", msg: "Cập nhật người dùng thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error updating user:");
    }
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { oldPassword, newPassword } = req.body as {
        oldPassword: string;
        newPassword: string;
      };
      const result = await this.service.changePassword(
        req.user?.id || "",
        oldPassword,
        newPassword,
      );
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error changing password:");
    }
  };

  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.updateProfile(
        req.user?.id || "",
        req.body,
      );
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error updating profile:");
    }
  };

  addPushToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { token } = req.body as PushTokenInput;
      const result = await this.service.addPushToken(req.user?.id || "", token);
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error adding push token:");
    }
  };

  
  inactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.inactivateUser(
        req.user?.id || "",
        req.params.id,
      );
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error inactivating user:");
    }
  };

  reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.reactivateUser(
        req.user?.id || "",
        req.params.id,
      );
      res.status(200).json(result);
    } catch (err) {
      handleControllerError(err, res, "Error reactivating user:");
    }
  };
}

const userController = new UserController(userService);

export default userController;
