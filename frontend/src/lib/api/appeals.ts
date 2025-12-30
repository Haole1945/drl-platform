/**
 * API client for appeals
 */

import { apiClient, type ApiResponse } from "@/lib/api";
import type {
  Appeal,
  CreateAppealRequest,
  ReviewAppealRequest,
  CanAppealResponse,
} from "@/types/appeal";

const APPEALS_BASE = "/appeals";

/**
 * Create a new appeal
 */
export async function createAppeal(
  request: CreateAppealRequest
): Promise<ApiResponse<Appeal>> {
  const response = await apiClient.post<Appeal>(APPEALS_BASE, request);
  return response;
}

/**
 * Get student's appeals (paginated)
 */
export async function getMyAppeals(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<{ content: Appeal[]; totalElements: number; totalPages: number }>> {
  const response = await apiClient.get<{
    content: Appeal[];
    totalElements: number;
    totalPages: number;
  }>(`${APPEALS_BASE}/my?page=${page}&size=${size}`);
  return response;
}

/**
 * Get pending appeals for reviewers (paginated)
 */
export async function getPendingAppeals(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<{ content: Appeal[]; totalElements: number; totalPages: number }>> {
  const response = await apiClient.get<{
    content: Appeal[];
    totalElements: number;
    totalPages: number;
  }>(`${APPEALS_BASE}/pending?page=${page}&size=${size}`);
  return response;
}

/**
 * Get appeal by ID
 */
export async function getAppealById(id: number): Promise<ApiResponse<Appeal>> {
  const response = await apiClient.get<Appeal>(`${APPEALS_BASE}/${id}`);
  return response;
}

/**
 * Review an appeal (accept or reject)
 */
export async function reviewAppeal(
  id: number,
  request: ReviewAppealRequest
): Promise<ApiResponse<Appeal>> {
  const response = await apiClient.put<Appeal>(
    `${APPEALS_BASE}/${id}/review`,
    request
  );
  return response;
}

/**
 * Check if can appeal for evaluation
 */
export async function canAppeal(
  evaluationId: number
): Promise<ApiResponse<CanAppealResponse>> {
  const response = await apiClient.get<CanAppealResponse>(
    `${APPEALS_BASE}/evaluation/${evaluationId}/can-appeal`
  );
  return response;
}

/**
 * Get appeal count for student
 */
export async function getAppealCount(): Promise<number> {
  try {
    const response = await apiClient.get<number>(`${APPEALS_BASE}/my/count`);
    return response.success && response.data !== undefined ? response.data : 0;
  } catch (error) {
    // Silently return 0 if backend not ready
    return 0;
  }
}

/**
 * Get pending appeal count for reviewers
 */
export async function getPendingAppealCount(): Promise<number> {
  try {
    const response = await apiClient.get<number>(`${APPEALS_BASE}/pending/count`);
    return response.success && response.data !== undefined ? response.data : 0;
  } catch (error) {
    // Silently return 0 if backend not ready
    return 0;
  }
}

/**
 * Upload evidence file for appeal
 * Returns file ID on success
 */
export async function uploadAppealFile(
  file: File,
  evaluationId: number,
  criteriaId: number
): Promise<number | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (evaluationId > 0) {
      formData.append("evaluationId", evaluationId.toString());
    }
    // Use criteriaId = 1 as default if 0 is provided (backend requires non-null criteriaId)
    formData.append("criteriaId", (criteriaId > 0 ? criteriaId : 1).toString());

    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    // Prepare headers
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    // Use Next.js API route as proxy to backend
    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data?.id) {
      return result.data.id;
    }
    
    console.error("Upload response missing file ID:", result);
    return null;
  } catch (error) {
    console.error("File upload error:", error);
    return null;
  }
}
