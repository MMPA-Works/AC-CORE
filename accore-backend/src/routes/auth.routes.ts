import express from 'express';
import { loginAdmin } from '../controllers/auth.controller';

const router = express.Router();

router.post('/admin/login', loginAdmin);

export default router;