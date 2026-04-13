import { Response } from "express";
import { AuthRequest } from "../types";
import {
  CreateThresholdInput,
  SetThresholdActiveInput,
  UpdateThresholdInput,
} from "../models/ThresholdSchema";
import thresholdService, {
  ThresholdService,
} from "../services/threshold.service";
import handleControllerError from "../utils/handleControllerError";

export class ThresholdController {
  constructor(private readonly service: ThresholdService) {}

  createThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const threshold = await this.service.createThreshold(
        req.params.id,
        req.body as CreateThresholdInput,
        req.user?.id,
      );
      res.status(201).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error creating threshold:");
    }
  };

  getThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const threshold = await this.service.getThreshold(req.params.id);
      res.status(200).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error fetching threshold:");
    }
  };

  updateThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const threshold = await this.service.updateThreshold(
        req.params.thresholdId,
        req.body as UpdateThresholdInput,
        req.user?.id,
      );
      res.status(200).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error updating threshold:");
    }
  };

  deleteThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const threshold = await this.service.deleteThreshold(
        req.params.thresholdId,
      );
      res.status(200).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error deleting threshold:");
    }
  };

  setThresholdActive = async (
    req: AuthRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const threshold = await this.service.setThresholdActive(
        req.params.thresholdId,
        req.body as SetThresholdActiveInput,
        req.user?.id,
      );
      res.status(200).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error switching threshold active:");
    }
  };
}

const thresholdController = new ThresholdController(thresholdService);

export default thresholdController;
