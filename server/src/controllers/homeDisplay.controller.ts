import homeDisplayService, { HomeDisplayService } from "../services/homeDisplay.service";
import { AuthRequest } from "../types";
import handleControllerError from "../utils/handleControllerError";
import { Response } from "express";

export class HomeDisplayController {
  constructor(private service: HomeDisplayService) {}

  getHomeDisplay = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const homeDisplay = await this.service.getHomeDisplayByUserId(
        req.user?.id!,
      );
      res.status(200).json(homeDisplay);
    } catch (err) {
      handleControllerError(err, res, "Error fetching home display:");
    }
  };

  updateHomeDisplay = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const homeDisplay = await this.service.updateHomeDisplay(
        req.user?.id!,
        req.body,
      );
      res.status(200).json(homeDisplay);
    } catch (err) {
      handleControllerError(err, res, "Error updating home display:");
    }
  };

  createHomeDisplay = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const homeDisplay = await this.service.createHomeDisplay(req.user?.id!, {
        tempId: req.body.tempId,
        briId: req.body.briId,
        humId: req.body.humId,
        instantControl: req.body.instantControl ?? [],
      });
      res.status(201).json(homeDisplay);
    } catch (err) {
      handleControllerError(err, res, "Error creating home display:");
    }
  }
}

const homeDisplayController = new HomeDisplayController(homeDisplayService);

export default homeDisplayController;
