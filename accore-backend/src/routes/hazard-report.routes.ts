import { Router } from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  getAnalytics,
} from "../controllers/hazard-report.controller";
import { upload } from "../middlewares/upload.middleware";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware";
import { reportLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/analytics", verifyToken, verifyAdmin, getAnalytics);
router.post("/", verifyToken, reportLimiter, upload.single("image"), createReport);
router.get("/", verifyToken, getReports);
router.get("/:id", getReportById);
router.put("/:id/status", verifyToken, verifyAdmin, updateReportStatus);

export default router;