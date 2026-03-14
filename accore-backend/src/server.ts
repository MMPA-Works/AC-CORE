import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import connectCloudinary from './config/cloudinary';
import hazardReportRoutes from './routes/hazard-report.routes';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import citizenAuthRoutes from './routes/citizen-auth.routes';
import barangayRoutes from './routes/barangay.routes';
import './services/weather.service';
import { getCurrentWeather } from './services/weather.service';

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'AC-CORE Backend API is running smoothly.' });
});

app.get('/api/weather', (req: Request, res: Response) => {
  const weather = getCurrentWeather();
  if (weather) {
    res.status(200).json(weather);
  } else {
    res.status(404).json({ message: 'Weather data not available yet.' });
  }
});

app.use('/api/reports', hazardReportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/citizen', citizenAuthRoutes);
app.use('/api/geospatial', barangayRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('GLOBAL EXPRESS ERROR CAUGHT:', err);
  res.status(500).json({ message: 'A backend error occurred.', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});