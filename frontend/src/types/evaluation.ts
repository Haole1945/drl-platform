/**
 * Evaluation Types
 */

export type EvaluationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CLASS_APPROVED'
  | 'FACULTY_APPROVED'
  | 'CTSV_APPROVED'
  | 'REJECTED';

export interface SubCriteria {
  id: string; // e.g., "1.1", "1.2"
  name: string; // e.g., "Ý thức và thái độ trong học tập"
  description: string; // Full description
  maxPoints: number; // Max points for this sub-criteria
  score: number; // User input score
  evidence: string; // Evidence for this sub-criteria
}

export interface CriteriaWithSubCriteria {
  id: number;
  name: string;
  description?: string;
  maxPoints: number;
  orderIndex: number;
  rubricId: number;
  subCriteria: SubCriteria[]; // Parsed sub-criteria
  totalScore: number; // Auto-calculated sum of sub-criteria scores
}

export interface EvaluationDetail {
  id?: number;
  criteriaId: number;
  criteriaName?: string;
  criteriaDescription?: string;
  selfScore?: number; // Frontend uses this
  score?: number; // Backend uses this
  maxScore?: number; // Backend uses maxScore
  maxPoints?: number; // Frontend uses this
  evidence?: string;
  comment?: string; // Frontend uses this
  note?: string; // Backend uses this
  // New: sub-criteria details
  subCriteriaScores?: Record<string, number>; // Map of subCriteriaId -> score
  subCriteriaEvidence?: Record<string, string>; // Map of subCriteriaId -> evidence
}

export interface Evaluation {
  id: number;
  studentCode: string;
  studentName?: string;
  semester: string;
  academicYear?: string;
  totalPoints?: number;
  totalScore?: number; // Backend uses totalScore
  maxScore?: number;
  status: EvaluationStatus;
  rejectionReason?: string;
  appealReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  resubmissionCount?: number;
  rubricId: number;
  rubricName?: string;
  details: EvaluationDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEvaluationRequest {
  studentCode: string;
  semester: string;
  academicYear?: string;
  rubricId: number;
  details: EvaluationDetail[];
  asDraft?: boolean; // If true, allows saving incomplete evaluation
}

export interface UpdateEvaluationRequest {
  details: EvaluationDetail[];
}

export interface ApprovalRequest {
  comment?: string;
}

export interface RejectionRequest {
  reason: string;
}

export interface ResubmitEvaluationRequest {
  details: EvaluationDetail[];
  responseToRejection?: string;
}

export interface Rubric {
  id: number;
  name: string;
  description?: string;
  maxScore: number;
  academicYear?: string;
  isActive: boolean;
  targetClasses?: string; // Comma-separated class codes: "D21CQCN01-N,D20CQCN01-N" or null for all
  criteria?: Criteria[];
  criteriaCount?: number;
}

export interface Criteria {
  id: number;
  name: string;
  description?: string;
  maxPoints: number;
  orderIndex: number;
  rubricId: number;
  rubricName?: string;
}

export interface EvaluationPeriod {
  id: number;
  name: string;
  semester: string;
  academicYear: string;
  startDate: string | number[]; // Can be ISO string or LocalDate array [year, month, day]
  endDate: string | number[]; // Can be ISO string or LocalDate array [year, month, day]
  isActive: boolean;
  description?: string;
  isOpen?: boolean;
  isFuture?: boolean;
  isEnded?: boolean;
}

export interface CreateEvaluationPeriodRequest {
  name: string;
  semester: string;
  academicYear: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  description?: string;
  isActive?: boolean;
}

export interface UpdateEvaluationPeriodRequest {
  name?: string;
  semester?: string;
  academicYear?: string;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  description?: string;
  isActive?: boolean;
}
