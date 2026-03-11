import { Router } from 'express';
import { googleLogin, registerCitizen, loginCitizen } from '../controllers/citizen-auth.controller';
import { loginLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

router.post('/google', loginLimiter, googleLogin);
router.post('/register', registerCitizen);
router.post('/login', loginLimiter, loginCitizen);

export default router;