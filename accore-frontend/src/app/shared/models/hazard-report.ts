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
  citizenId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  barangay: string;
  location: HazardReportLocation;
  status: HazardReportStatus;
  imageURL: string;
  statusHistory: HazardReportStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
