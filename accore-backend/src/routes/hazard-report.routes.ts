import express from 'express';
import { createReport, getReports } from '../controllers/hazard-report.controller';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.post('/', upload.single('image'), createReport);
router.get('/', getReports);

export default router;