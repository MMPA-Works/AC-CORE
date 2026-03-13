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
  isHighPriority?: boolean;
  isArchived?: boolean;
  imageURL: string;
  verifications: string[];
  hasVerified?: boolean;
  statusHistory: HazardReportStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface HazardReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedHazardReportResponse {
  reports: HazardReport[];
  pagination: HazardReportPagination;
  filters?: {
    barangays: string[];
    categories: string[];
  };
}

export interface HazardReportPageQuery {
  page: number;
  limit: number;
  archived?: 'true' | 'false';
  search?: string;
  barangay?: string;
  category?: string;
  severity?: string;
  status?: string;
  sortColumn?: 'severity' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}