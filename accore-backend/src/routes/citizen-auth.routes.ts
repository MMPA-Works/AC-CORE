import { Router } from 'express';
import { googleLogin, registerCitizen, loginCitizen } from '../controllers/citizen-auth.controller';

const router = Router();

router.post('/google', googleLogin);
router.post('/register', registerCitizen);
router.post('/login', loginCitizen);

export default router;