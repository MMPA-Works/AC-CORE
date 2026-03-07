import express from 'express';
import { uploadImage } from '../controllers/upload.controller';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.post('/', upload.single('image'), uploadImage);

export default router;