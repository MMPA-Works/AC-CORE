import mongoose, { Schema, Document } from "mongoose";
import { ANGELES_CITY_BARANGAYS } from "../utils/constants";

export interface IHazardReport extends Document {
  citizenId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  severity: string;
  barangay: string;
  isHighPriority: boolean;
  isPossibleDuplicate: boolean;
  isArchived: boolean;
  elevation: number;
  location: {
    type: string;
    coordinates: number[];
  };
  status: string;
  imageURL: string;
  verifications: mongoose.Types.ObjectId[];
  statusHistory: {
    status: string;
    updatedBy: mongoose.Types.ObjectId;
    adminName: string;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const hazardReportSchema: Schema = new Schema(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: "Citizen",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Pothole",
        "Clogged Drain",
        "Fallen Tree",
        "Streetlight Out",
        "Flooding",
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "Critical"],
    },
    barangay: {
      type: String,
      required: true,
      enum: ANGELES_CITY_BARANGAYS,
    },
    isHighPriority: {
      type: Boolean,
      default: false,
    },
    isPossibleDuplicate: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    elevation: {
      type: Number,
      default: 0,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["Reported", "Under Review", "In Progress", "Resolved"],
      default: "Reported",
    },
    imageURL: {
      type: String,
      required: true,
    },
    verifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Citizen",
      },
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: "Admin",
          required: true,
        },
        adminName: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

hazardReportSchema.index({ location: "2dsphere" });

export default mongoose.model<IHazardReport>(
  "HazardReport",
  hazardReportSchema,
);