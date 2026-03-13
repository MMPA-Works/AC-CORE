import { Request, Response } from "express";
import { Types } from "mongoose";
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

const SEVERITY_WEIGHT: Record<string, number> = {
  Low: 1,
  Medium: 2,
  Critical: 3,
};

const STATUS_WEIGHT: Record<string, number> = {
  Reported: 1,
  "Under Review": 2,
  "In Progress": 3,
  Resolved: 4,
};

const ACTIVE_PUBLIC_STATUSES = [
  "Reported",
  "Under Review",
  "Dispatched",
  "In Progress",
];

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  max = 100,
): number => {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const normalizeQueryValue = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

const buildAdminMatch = (query: Request["query"]) => {
  const archiveState = normalizeQueryValue(query.archived);
  const filters: Record<string, unknown> = {
    isArchived: archiveState === "true" ? true : { $ne: true },
  };

  const barangay = normalizeQueryValue(query.barangay);
  const category = normalizeQueryValue(query.category);
  const severity = normalizeQueryValue(query.severity);
  const status = normalizeQueryValue(query.status);
  const search = normalizeQueryValue(query.search);

  if (barangay && barangay !== "All") filters.barangay = barangay;
  if (category && category !== "All") filters.category = category;
  if (severity && severity !== "All") filters.severity = severity;
  if (status && status !== "All") filters.status = status;
  if (search) {
    const searchRegex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    const searchFilters: Record<string, unknown>[] = [
      { title: searchRegex },
      { category: searchRegex },
      { barangay: searchRegex },
      { status: searchRegex },
      { severity: searchRegex },
    ];

    if (Types.ObjectId.isValid(search)) {
      searchFilters.push({ _id: new Types.ObjectId(search) });
    }

    filters.$or = searchFilters;
  }

  return filters;
};

const buildAdminSort = (sortColumn: string | null, sortDirection: 1 | -1) => {
  switch (sortColumn) {
    case "severity":
      return { severityWeight: sortDirection, createdAt: -1 as const };
    case "status":
      return { statusWeight: sortDirection, createdAt: -1 as const };
    case "createdAt":
    default:
      return { createdAt: sortDirection };
  }
};

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

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const possibleDuplicate = await HazardReport.findOne({
      category,
      createdAt: { $gte: twentyFourHoursAgo },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parsedLongitude, parsedLatitude],
          },
          $maxDistance: 50,
        },
      },
    }).select("_id");

    const newReport = new HazardReport({
      citizenId,
      title,
      description,
      category,
      severity,
      barangay,
      isPossibleDuplicate: !!possibleDuplicate,
      location: {
        type: "Point",
        coordinates: [parsedLongitude, parsedLatitude],
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

    const hasPagination =
      req.query.page !== undefined || req.query.limit !== undefined;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    if (userRole === "admin") {
      if (hasPagination) {
        const filters = buildAdminMatch(req.query);
        const sortColumn = normalizeQueryValue(req.query.sortColumn);
        const sortDirection =
          normalizeQueryValue(req.query.sortDirection) === "asc" ? 1 : -1;
        const pipeline: any[] = [];
        const archiveFilter = filters.isArchived;

        if (Object.keys(filters).length) {
          pipeline.push({ $match: filters });
        }

        pipeline.push({
          $addFields: {
            severityWeight: {
              $switch: {
                branches: Object.entries(SEVERITY_WEIGHT).map(
                  ([label, weight]) => ({
                    case: { $eq: ["$severity", label] },
                    then: weight,
                  }),
                ),
                default: 0,
              },
            },
            statusWeight: {
              $switch: {
                branches: Object.entries(STATUS_WEIGHT).map(
                  ([label, weight]) => ({
                    case: { $eq: ["$status", label] },
                    then: weight,
                  }),
                ),
                default: 0,
              },
            },
          },
        });

        pipeline.push({ $sort: buildAdminSort(sortColumn, sortDirection) });
        pipeline.push({
          $facet: {
            reports: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        });

        const [aggregateResult, barangays, categories] = await Promise.all([
          HazardReport.aggregate(pipeline),
          HazardReport.distinct("barangay", { isArchived: archiveFilter }),
          HazardReport.distinct("category", { isArchived: archiveFilter }),
        ]);
        const [result] = aggregateResult;
        const reports = result?.reports ?? [];
        const total = result?.totalCount?.[0]?.count ?? 0;

        res.status(200).json({
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
          filters: {
            barangays: barangays.sort(),
            categories: categories.sort(),
          },
        });
        return;
      }

      const reports = await HazardReport.aggregate([
        {
          $match: {
            isArchived: { $ne: true },
          },
        },
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
      const query = { citizenId: userId, isArchived: { $ne: true } };

      if (hasPagination) {
        const [reports, total] = await Promise.all([
          HazardReport.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          HazardReport.countDocuments(query),
        ]);

        res.status(200).json({
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        });
        return;
      }

      const reports = await HazardReport.find(query).sort({
        createdAt: -1,
      });
      res.status(200).json(reports);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch hazard reports", error });
  }
};

export const archiveReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized. Admin ID missing." });
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

    report.isArchived = !report.isArchived;

    const updatedReport = await report.save();
    res.status(200).json(updatedReport);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to archive report",
      error: error.message,
    });
  }
};

export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const report = await HazardReport.findById(req.params.id).populate(
      "citizenId",
      "firstName lastName",
    );

    if (!report) {
      return res.status(404).json({ message: "Hazard report not found" });
    }

    const ownerId =
      typeof report.citizenId === "object" &&
      report.citizenId !== null &&
      "_id" in report.citizenId
        ? String((report.citizenId as any)._id)
        : String(report.citizenId);

    if (userRole !== "admin" && ownerId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden. You can only view your own reports." });
    }

    res.status(200).json(report);
  } catch (error) {
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
        $match: {
          isArchived: { $ne: true },
        },
      },
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
          // Inside getAnalytics function, update the activeHotspots array:
          activeHotspots: [
            {
              $match: {
                status: { $in: ["Reported", "Under Review", "In Progress"] },
              },
            },
            {
              $project: {
                title: 1,
                severity: 1,
                location: 1,
                category: 1,
                barangay: 1,
                verifications: 1,
              },
            },
          ],
        },
      },
    ]);

    const [data] = analyticsData;

    const activeStatuses = ["Reported", "Under Review", "In Progress"];
    const totalActive =
      data?.byStatus
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

export const getPublicReports = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reports = await HazardReport.find({
      isArchived: { $ne: true },
      status: { $in: ACTIVE_PUBLIC_STATUSES },
    })
      .select(
        "title description category severity barangay location status createdAt verifications",
      )
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch public reports",
      error: error.message,
    });
  }
};

export const toggleVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reportId = req.params.id;
    // Check for both id and _id depending on how your JWT payload is structured
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      res
        .status(401)
        .json({ message: "Unauthorized. User ID not found in token." });
      return;
    }

    const report = await HazardReport.findById(reportId);

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Safely initialize the array if it doesn't exist for older reports
    if (!report.verifications) {
      report.verifications = [];
    }

    // Clean out any null/undefined values that might have sneaked into the DB
    report.verifications = report.verifications.filter((id) => id != null);

    // Safely check if the user has already verified
    const hasVerified = report.verifications.some(
      (id) => id && id.toString() === userId.toString(),
    );

    if (hasVerified) {
      // User already verified, so we remove their ID (un-verify)
      report.verifications = report.verifications.filter(
        (id) => id && id.toString() !== userId.toString(),
      );
    } else {
      // User has not verified, so we add their ID
      report.verifications.push(userId as any);
    }

    await report.save();

    res.status(200).json(report);
  } catch (error: any) {
    console.error("Error toggling verification:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
