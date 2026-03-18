import { AddUserInput } from "../models/UserSchema";
import userService, { UserService } from "../services/user.service";
import { AuthRequest } from "../types";
import handleControllerError from "../utils/handleControllerError";
import { Request, Response } from "express";

export class UserController{
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
}

const userController = new UserController(userService);

export default userController;