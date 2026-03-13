import { Router } from "express";
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  archiveReport,
  getAnalytics,
  getPublicReports,
  toggleVerify,
  getDownstreamGroupings
} from "../controllers/hazard-report.controller";
import { upload } from "../middlewares/upload.middleware";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware";
import { reportLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// Static routes must come before dynamic /:id routes
router.get("/analytics", verifyToken, verifyAdmin, getAnalytics);
router.get("/downstream-risks", verifyToken, verifyAdmin, getDownstreamGroupings);
router.get("/public", verifyToken, getPublicReports);
router.get("/", verifyToken, getReports);

// Dynamic routes
router.post("/", verifyToken, reportLimiter, upload.single("image"), createReport);
router.get("/:id", verifyToken, getReportById);
router.patch("/:id/verify", verifyToken, toggleVerify);
router.put("/:id/status", verifyToken, verifyAdmin, updateReportStatus);
router.put("/:id/archive", verifyToken, verifyAdmin, archiveReport);

export default router;