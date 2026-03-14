import { Router } from "express";
import {
  createReport,
  createGuestReport,
  getReports,
  getReportById,
  updateReportStatus,
  getAnalytics,
  getPublicReports,
  toggleVerify,
  getDownstreamGroupings,
} from "../controllers/hazard-report.controller";
import { upload } from "../middlewares/upload.middleware";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware";
import { reportLimiter } from "../middlewares/rate-limit.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createGuestReportSchema,
  createReportSchema,
  updateStatusSchema,
} from "../validations/hazard-report.validation";

const router = Router();

router.get("/analytics", verifyToken, verifyAdmin, getAnalytics);
router.get(
  "/downstream-risks",
  verifyToken,
  verifyAdmin,
  getDownstreamGroupings,
);
router.get("/public", verifyToken, getPublicReports);
router.get("/", verifyToken, getReports);

router.post(
  "/",
  verifyToken,
  reportLimiter,
  upload.single("image"),
  validate(createReportSchema),
  createReport,
);

router.post(
  "/guest",
  reportLimiter,
  upload.single("image"),
  validate(createGuestReportSchema),
  createGuestReport,
);

router.get("/:id", verifyToken, getReportById);
router.patch("/:id/verify", verifyToken, toggleVerify);

router.put(
  "/:id/status", 
  verifyToken, 
  verifyAdmin, 
  validate(updateStatusSchema), 
  updateReportStatus
);

router.put("/:id/archive", verifyToken, verifyAdmin, archiveReport);

export default router;
