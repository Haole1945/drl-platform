/**
 * Appeal types for the appeals system
 */

export type AppealStatus = "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";

export type AppealDecision = "ACCEPT" | "REJECT";

export interface Appeal {
  id: number;
  evaluationId: number;
  studentCode: string;
  studentName?: string;
  evaluationSemester?: string;
  appealReason: string;
  status: AppealStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
  appealedCriteria: AppealCriteria[];
  evidenceFiles: AppealFile[];
}

export interface AppealCriteria {
  id: number;
  criteriaId: number;
  criteriaName?: string;
}

export interface AppealFile {
  id: number;
  fileId: number;
  fileUrl: string;
  fileName: string;
}

export interface CreateAppealRequest {
  evaluationId: number;
  appealReason: string;
  criteriaIds: number[]; // Empty array means "all criteria"
  fileIds: number[];
}

export interface ReviewAppealRequest {
  decision: AppealDecision;
  comment: string;
}

export interface CanAppealResponse {
  canAppeal: boolean;
  deadline: string | null;
}

export interface AppealListItem {
  id: number;
  evaluationId: number;
  studentCode: string;
  studentName?: string;
  evaluationSemester?: string;
  status: AppealStatus;
  createdAt: string;
  criteriaCount: number;
}
