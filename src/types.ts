/**
 * CityPulse AI Type System
 */

export type UserRole = "citizen" | "officer" | "admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type IssueCategory =
  | "Pothole"
  | "Garbage"
  | "Water Leakage"
  | "Broken Streetlight"
  | "Open Manhole"
  | "Road Damage"
  | "Traffic Signal Issue";

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus = "Pending" | "In Progress" | "Resolved" | "Critical";

export interface IssueTicket {
  id: string; // Document ID
  reporterId: string;
  reporterName: string;
  photoUrl: string; // base64 payload as safe persistent storage
  latitude: number;
  longitude: number;
  locationName: string;
  description: string;
  category: IssueCategory;
  confidenceScore: number;
  severity: IssueSeverity;
  severityScore: number; // 0 to 100
  assignedDepartment: string;
  complaintText: string;
  suggestedAction: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  resolutionDate?: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  head: string;
  email: string;
  issueCount: number;
  resolvedCount: number;
}

export interface AuditReport {
  id: string;
  issueId: string;
  type: string; // e.g. "Report Filed", "Status Changed", "Citizen Comment"
  description: string;
  createdAt: string;
}

export interface StatMetric {
  id: string;
  title: string;
  value: number;
  updatedAt: string;
}
