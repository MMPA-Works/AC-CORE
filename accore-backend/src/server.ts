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
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/citizen', citizenAuthRoutes);
console.log('SUCCESS: The server is reading the new barangay routes!');
app.use('/api/geospatial', barangayRoutes);

// Industry standard global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('GLOBAL EXPRESS ERROR CAUGHT:', err);
  res.status(500).json({ message: 'A backend error occurred.', error: err.message });
});

// Industry standard global error handler to catch silent middleware crashes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('SILENT BACKEND CRASH CAUGHT:', err);
  res.status(500).json({ message: 'A backend error occurred.', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});