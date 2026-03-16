import { Response } from "express";
import { AuthRequest } from "../types";
import { UpdateThresholdInput } from "../models/ThresholdSchema";
import thresholdService, {
  ThresholdService,
  ThresholdServiceError,
} from "../services/threshold.service";

export class ThresholdController {
  constructor(private readonly service: ThresholdService) {}

  getThreshold = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const threshold = await this.service.getThreshold(req.params.id);
      res.status(200).json(threshold);
    } catch (err) {
      if (err instanceof ThresholdServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
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
      if (err instanceof ThresholdServiceError) {
        res
          .status(err.statusCode)
          .json({ code: `${err.statusCode}`, msg: err.message });
        return;
      }
      res.status(500).json({ code: "500", msg: "Server Error." });
    }
  };
}

const thresholdController = new ThresholdController(thresholdService);

export default thresholdController;
