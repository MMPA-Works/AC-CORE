import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import connectCloudinary from './config/cloudinary';
import hazardReportRoutes from './routes/hazard-report.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'AC-CORE Backend API is running smoothly.' });
});

app.use('/api/reports', hazardReportRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

app.use('/api/reports', hazardReportRoutes);
app.use('/api/upload', uploadRoutes);