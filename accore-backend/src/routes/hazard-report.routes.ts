import express from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/hazard-report.controller';
import { upload } from '../middlewares/upload.middleware';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', verifyToken, upload.single('image'), createReport);
router.get('/', verifyToken, getReports);
router.put('/:id/status', verifyToken, updateReportStatus);

export default router;