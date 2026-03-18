import { Response } from "express";
import { ServiceError } from "../errors/service.error";

const handleControllerError = (
  err: unknown,
  res: Response,
  logMessage?: string,
): void => {
  if (err instanceof ServiceError) {
    res
      .status(err.statusCode)
      .json({ code: `${err.statusCode}`, msg: err.message });
    return;
  }

  if (logMessage) {
    console.error(logMessage, err);
  }

  res.status(500).json({ code: "500", msg: "Server Error." });
};

export default handleControllerError;
