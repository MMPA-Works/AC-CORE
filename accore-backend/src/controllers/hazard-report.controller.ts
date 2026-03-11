import { Request, Response } from "express";
import HazardReport from "../models/hazard-report.model";
import Admin from "../models/admin.model";
import { v2 as cloudinary } from "cloudinary";
import { PRIORITY_COMMERCIAL_ZONES } from "../utils/constants";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const createReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  console.log("1. Controller reached successfully. Processing image...");

  try {
    const citizenId = req.user?.id;

    if (!citizenId) {
      res.status(401).json({ message: "Unauthorized. Please log in." });
      return;
    }

    if (!req.file) {
      console.log("Error: No image file received.");
      res.status(400).json({ message: "Image file is required." });
      return;
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    console.log("2. Uploading image to Cloudinary...");
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: "accore_hazards",
    });

    console.log("3. Image uploaded. Saving data to MongoDB...");
    const {
      title,
      description,
      category,
      severity,
      barangay,
      latitude,
      longitude,
    } = req.body;

    const newReport = new HazardReport({
      citizenId,
      title,
      description,
      category,
      severity,
      barangay,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      imageURL: uploadResponse.secure_url,
      status: "Reported",
    });

    const savedReport = await newReport.save();
    console.log("4. Success! Hazard report saved.");
    res.status(201).json(savedReport);
  } catch (error: any) {
    console.error("CRITICAL ERROR SAVING REPORT:", error);
    res.status(500).json({
      message: "Failed to create hazard report",
      error: error.message,
    });
  }
};

export const getReports = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized. Please log in." });
      return;
    }

    if (userRole === "admin") {
      const reports = await HazardReport.aggregate([
        {
          $addFields: {
            priorityWeight: {
              $cond: {
                if: { $in: ["$barangay", PRIORITY_COMMERCIAL_ZONES] },
                then: 1,
                else: 2,
              },
            },
          },
        },
        {
          $sort: {
            priorityWeight: 1,
            createdAt: -1,
          },
        },
      ]);

      res.status(200).json(reports);
    } else {
      const reports = await HazardReport.find({ citizenId: userId }).sort({
        createdAt: -1,
      });
      res.status(200).json(reports);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch hazard reports", error });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    // Add .populate() to fetch the citizen's first and last name
    const report = await HazardReport.findById(req.params.id).populate(
      "citizenId",
      "firstName lastName"
    );

    if (!report) {
      return res.status(404).json({ message: "Hazard report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    // Catch invalid ObjectId formats or database connection issues
    res.status(500).json({ message: "Server error retrieving the report" });
  }
};
export const updateReportStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized. Admin ID missing." });
      return;
    }

    // Updated validation array
    const validStatuses = [
      "Reported",
      "Under Review",
      "In Progress",
      "Resolved",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status provided." });
      return;
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      res.status(404).json({ message: "Admin not found." });
      return;
    }

    const report = await HazardReport.findById(id);
    if (!report) {
      res.status(404).json({ message: "Hazard report not found." });
      return;
    }

    report.status = status;
    report.statusHistory.push({
      status: status,
      updatedBy: admin._id as any,
      adminName: `${admin.firstName} ${admin.lastName}`,
      updatedAt: new Date(),
    });

    const updatedReport = await report.save();

    res.status(200).json(updatedReport);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to update report status",
      error: error.message,
    });
  }
};

export const getAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const analyticsData = await HazardReport.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byBarangay: [
            { $group: { _id: "$barangay", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          bySeverity: [{ $group: { _id: "$severity", count: { $sum: 1 } } }],
          recentActivity: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                title: 1,
                barangay: 1,
                status: 1,
                severity: 1,
                createdAt: 1,
                location: 1,
              },
            },
          ],
          activeHotspots: [
            { $match: { status: { $in: ["Reported", "Under Review", "In Progress"] } } },
            { $project: { title: 1, severity: 1, location: 1 } }
          ]
        },
      },
    ]);

    const [data] = analyticsData;

    const activeStatuses = ["Reported", "Under Review", "In Progress"];
    const totalActive = data?.byStatus
      .filter((s: any) => activeStatuses.includes(s._id))
      .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

    const result = {
      totalActive,
      byStatus: data?.byStatus || [],
      byBarangay: data?.byBarangay || [],
      bySeverity: data?.bySeverity || [],
      recentActivity: data?.recentActivity || [],
      activeHotspots: data?.activeHotspots || [],
    };

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch analytics data",
      error: error.message,
    });
  }
};