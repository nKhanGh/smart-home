import { Router } from "express";
import { check } from "express-validator";
import { verifyToken } from "../middleware/authMiddleware";
import { getAllConfig, getConfig, setConfig } from "../controllers/configController";

const router = Router();

router.get("/",     verifyToken, getAllConfig);
router.get("/:key", verifyToken, getConfig);
router.put("/:key", verifyToken, [
  check("config_value", "config_value không được trống").notEmpty(),
], setConfig);

export default router;
