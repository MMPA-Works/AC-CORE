export type HazardReportStatus =
  | 'Reported'
  | 'Under Review'
  | 'Dispatched'
  | 'In Progress'
  | 'Resolved';

export interface HazardReportStatusHistoryEntry {
  status: string;
  updatedBy: string;
  adminName: string;
  updatedAt: string;
}

export interface HazardReportLocation {
  type: 'Point';
  coordinates: number[];
}

export interface HazardReport {
  _id: string;
  citizenId: string | null;
  guestContact?: string | null;
  title: string;
  description: string;
  category: string;
  severity: string;
  barangay: string;
  location: HazardReportLocation;
  status: HazardReportStatus;
  isHighPriority?: boolean;
  isPossibleDuplicate?: boolean;
  isArchived?: boolean;
  imageURL: string;
  verifications: string[];
  hasVerified?: boolean;
  statusHistory: HazardReportStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
