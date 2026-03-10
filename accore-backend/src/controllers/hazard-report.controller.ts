import { Request, Response } from 'express';
import HazardReport from '../models/hazard-report.model';
import { v2 as cloudinary } from 'cloudinary';
import Admin from '../models/admin.model'; 

// Extend the Request interface to recognize the user object attached by the middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('1. Controller reached successfully. Processing image...');

  try {
    const citizenId = req.user?.id;

    if (!citizenId) {
      res.status(401).json({ message: 'Unauthorized. Please log in.' });
      return;
    }

    if (!req.file) {
      console.log('Error: No image file received.');
      res.status(400).json({ message: 'Image file is required.' });
      return;
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
    
    console.log('2. Uploading image to Cloudinary...');
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'accore_hazards'
    });

    console.log('3. Image uploaded. Saving data to MongoDB...');
    const { title, description, category, severity, barangay, latitude, longitude } = req.body;

    const newReport = new HazardReport({
      citizenId,
      title,
      description,
      category,
      severity,
      barangay,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)], 
      },
      imageURL: uploadResponse.secure_url,
      status: 'Reported' 
    });

    const savedReport = await newReport.save();
    console.log('4. Success! Hazard report saved.');
    res.status(201).json(savedReport);
    
  } catch (error: any) {
    console.error('CRITICAL ERROR SAVING REPORT:', error);
    res.status(500).json({ message: 'Failed to create hazard report', error: error.message });
  }
};

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role; 

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized. Please log in.' });
      return;
    }

    if (userRole === 'admin') {
      // Admins get everything
      const reports = await HazardReport.find().sort({ createdAt: -1 });
      res.status(200).json(reports);
    } else {
      // Citizens only get their own reports
      const reports = await HazardReport.find({ citizenId: userId }).sort({ createdAt: -1 });
      res.status(200).json(reports);
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch hazard reports', error });
  }
};

export const updateReportStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: 'Unauthorized. Admin ID missing.' });
      return;
    }

    const validStatuses = ['Reported', 'Dispatched', 'Resolved'];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status. Must be Reported, Dispatched, or Resolved.' });
      return;
    }

    // 1. Fetch the admin to get their name
    const admin = await Admin.findById(adminId);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found.' });
      return;
    }

    // 2. Fetch the report
    const report = await HazardReport.findById(id);
    if (!report) {
      res.status(404).json({ message: 'Hazard report not found.' });
      return;
    }

    // 3. Update status and push to history
    report.status = status;
    report.statusHistory.push({
      status: status,
      updatedBy: admin._id as any,
      adminName: `${admin.firstName} ${admin.lastName}`,
      updatedAt: new Date()
    });

    const updatedReport = await report.save();

    res.status(200).json(updatedReport);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update report status', error: error.message });
  }
};