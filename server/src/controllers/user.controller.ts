import { AddUserInput } from "../models/UserSchema";
import userService, { UserService } from "../services/user.service";
import { AuthRequest } from "../types";
import handleControllerError from "../utils/handleControllerError";
import { Request, Response } from "express";

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
      res.status(200).json({ code: "200", msg: "Cập nhật người dùng thành công." });
    } catch (err) {
      handleControllerError(err, res, "Error updating user:");
    }
  };
}

const userController = new UserController(userService);

export default userController;
