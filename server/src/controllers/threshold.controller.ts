import { Response } from "express";
import { AuthRequest } from "../types";
import { UpdateThresholdInput } from "../models/ThresholdSchema";
import thresholdService, {
  ThresholdService,
} from "../services/threshold.service";
import handleControllerError from "../utils/handleControllerError";

export class ThresholdController {
  constructor(private readonly service: ThresholdService) {}

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
        req.params.id,
        req.body as UpdateThresholdInput,
        req.user?.id,
      );
      res.status(200).json(threshold);
    } catch (err) {
      handleControllerError(err, res, "Error updating threshold:");
    }
  };
}

const thresholdController = new ThresholdController(thresholdService);

export default thresholdController;
