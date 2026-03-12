import { Router } from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  archiveReport,
  getAnalytics,
} from "../controllers/hazard-report.controller";
import { upload } from "../middlewares/upload.middleware";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware";
import { reportLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/analytics", verifyToken, verifyAdmin, getAnalytics);
router.post("/", verifyToken, reportLimiter, upload.single("image"), createReport);
router.get("/", verifyToken, getReports);
router.get("/:id", verifyToken, getReportById);
router.put("/:id/status", verifyToken, verifyAdmin, updateReportStatus);
router.put("/:id/archive", verifyToken, verifyAdmin, archiveReport);

export default router;
