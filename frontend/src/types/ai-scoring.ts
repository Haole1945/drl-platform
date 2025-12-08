/**
 * Type definitions cho AI Scoring feature
 */

export interface SubCriteriaInfo {
  id: string; // e.g., "1.1", "1.2"
  name: string;
  description: string;
  maxPoints: number;
}

export interface AiScoringRequest {
  criteriaId: number;
  subCriteria?: SubCriteriaInfo[]; // Thông tin các sub-criteria để AI phân tích riêng
  evidenceFileIds: number[];
  evaluationId?: number;
  maxScore?: number;
}

export interface SubCriteriaScore {
  subCriteriaId: string;
  suggestedScore: number;
  maxScore: number;
  confidence: number;
  isAuthentic: boolean; // true nếu minh chứng là thật, false nếu giả/chỉnh sửa
  authenticityConfidence: number; // 0-100, độ tin cậy về tính xác thực
  reason: string;
}

export interface AiScoringResponse {
  suggestedScore: number; // Tổng điểm (tổng của các sub-criteria)
  maxScore: number;
  status: 'ACCEPTABLE' | 'REJECT' | 'UNCERTAIN';
  confidence: number; // 0-100 (phần trăm)
  reason: string;
  processingTimeMs: number;
  subCriteriaScores?: SubCriteriaScore[]; // Điểm cho từng sub-criteria
}

export interface AiScoringSuggestion {
  criteriaId: number;
  subCriteriaId?: string;
  response: AiScoringResponse;
  timestamp: Date;
}

