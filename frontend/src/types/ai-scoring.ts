/**
 * Type definitions cho AI Scoring feature
 */

export interface AiScoringRequest {
  criteriaId: number;
  subCriteriaId?: string;
  evidenceFileIds: number[];
  evaluationId?: number;
  maxScore?: number;
}

export interface AiScoringResponse {
  suggestedScore: number;
  maxScore: number;
  status: 'ACCEPTABLE' | 'REJECT' | 'UNCERTAIN';
  confidence: number; // 0-100 (phần trăm)
  reason: string;
  processingTimeMs: number;
}

export interface AiScoringSuggestion {
  criteriaId: number;
  subCriteriaId?: string;
  response: AiScoringResponse;
  timestamp: Date;
}

