/**
 * Evaluation API functions
 */

import { apiClient } from './api';
import type { ApiResponse } from './api';
import type {
  Evaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  ApprovalRequest,
  RejectionRequest,
  ResubmitEvaluationRequest,
  Rubric,
  Criteria,
} from '@/types/evaluation';

/**
 * Get all evaluations (with filters)
 */
export async function getEvaluations(params?: {
  studentCode?: string;
  semester?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse<{ content: Evaluation[]; totalElements: number; totalPages: number; number: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.studentCode) queryParams.append('studentCode', params.studentCode);
  if (params?.semester) queryParams.append('semester', params.semester);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  
  const query = queryParams.toString();
  return apiClient.get(`/evaluations${query ? `?${query}` : ''}`);
}

/**
 * Get evaluation by ID
 */
export async function getEvaluationById(id: number): Promise<ApiResponse<Evaluation>> {
  return apiClient.get(`/evaluations/${id}`);
}

/**
 * Create new evaluation (DRAFT)
 */
export async function createEvaluation(
  data: CreateEvaluationRequest
): Promise<ApiResponse<Evaluation>> {
  return apiClient.post<Evaluation>('/evaluations', data);
}

/**
 * Update evaluation (only in DRAFT)
 */
export async function updateEvaluation(
  id: number,
  data: UpdateEvaluationRequest
): Promise<ApiResponse<Evaluation>> {
  return apiClient.put<Evaluation>(`/evaluations/${id}`, data);
}

/**
 * Submit evaluation for approval
 */
export async function submitEvaluation(id: number): Promise<ApiResponse<Evaluation>> {
  return apiClient.post<Evaluation>(`/evaluations/${id}/submit`);
}

/**
 * Approve evaluation
 */
export async function approveEvaluation(
  id: number,
  comment?: string
): Promise<ApiResponse<Evaluation>> {
  return apiClient.post<Evaluation>(`/evaluations/${id}/approve`, { comment });
}

/**
 * Reject evaluation
 */
export async function rejectEvaluation(
  id: number,
  reason: string
): Promise<ApiResponse<Evaluation>> {
  return apiClient.post<Evaluation>(`/evaluations/${id}/reject`, { reason });
}

/**
 * Resubmit evaluation after rejection
 */
export async function resubmitEvaluation(
  id: number,
  data: ResubmitEvaluationRequest
): Promise<ApiResponse<Evaluation>> {
  return apiClient.post<Evaluation>(`/evaluations/${id}/resubmit`, data);
}

/**
 * Get pending evaluations for approval
 */
export async function getPendingEvaluations(params?: {
  level?: string;
  page?: number;
  size?: number;
}): Promise<ApiResponse<{ content: Evaluation[]; totalElements: number; totalPages: number; number: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.level) queryParams.append('level', params.level);
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  
  const query = queryParams.toString();
  return apiClient.get(`/evaluations/pending${query ? `?${query}` : ''}`);
}

/**
 * Get evaluations for a student
 */
export async function getStudentEvaluations(
  studentCode: string,
  semester?: string
): Promise<ApiResponse<Evaluation[]>> {
  const query = semester ? `?semester=${semester}` : '';
  return apiClient.get(`/evaluations/student/${studentCode}${query}`);
}

/**
 * Get active rubric
 */
export async function getActiveRubric(academicYear?: string): Promise<ApiResponse<Rubric>> {
  const query = academicYear ? `?academicYear=${academicYear}` : '';
  return apiClient.get(`/rubrics/active${query}`);
}

/**
 * Get rubric by ID
 */
export async function getRubricById(id: number): Promise<ApiResponse<Rubric>> {
  return apiClient.get(`/rubrics/${id}`);
}

/**
 * Get criteria by rubric ID
 */
export async function getCriteriaByRubric(rubricId: number): Promise<ApiResponse<Criteria[]>> {
  return apiClient.get(`/criteria?rubricId=${rubricId}`);
}

/**
 * Delete evaluation (only DRAFT status)
 */
export async function deleteEvaluation(id: number): Promise<ApiResponse<void>> {
  return apiClient.delete(`/evaluations/${id}`);
}

