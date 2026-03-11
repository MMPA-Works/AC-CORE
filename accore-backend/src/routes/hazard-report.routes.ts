import express from 'express';
import { 
  createReport, 
  getReports, 
  updateReportStatus, 
  getReportById,
  getAnalytics 
} from '../controllers/hazard-report.controller';
import { upload } from '../middlewares/upload.middleware';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', verifyToken, upload.single('image'), createReport);
router.get('/', verifyToken, getReports);

// The analytics route must be declared before /:id to prevent route parameter conflicts
router.get('/analytics', verifyToken, verifyAdmin, getAnalytics);

router.get('/:id', verifyToken, getReportById);
router.put('/:id/status', verifyToken, verifyAdmin, updateReportStatus);

export default router;