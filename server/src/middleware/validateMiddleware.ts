// src/middleware/validateMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const validate = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };

export default validate;