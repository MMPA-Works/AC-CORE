import { Router } from 'express';
import { getNearestBarangay } from '../controllers/barangay.controller';

const router = Router();

router.get('/nearest-barangay', getNearestBarangay);

export default router;
