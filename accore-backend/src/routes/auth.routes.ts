import express from 'express';
import { loginAdmin } from '../controllers/auth.controller';
import { loginLimiter } from '../middlewares/rate-limit.middleware';

const router = express.Router();

router.post('/admin/login', loginLimiter, loginAdmin);

export default router;