/**
 * API Client Utilities
 * Handles all API calls to the backend Gateway
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

// Note: Browser DevTools will still show HTTP errors (500, 503, etc.) in the Network tab
// These are expected for transient errors that will be automatically retried.
// The retry logic will handle these errors silently and only show errors if all retries fail.
// To reduce console noise, you can filter out 500/503 errors in DevTools:
// - Open DevTools > Network tab
// - Click the filter icon
// - Add filter: -status-code:500 -status-code:503

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp?: string;
  errors?: string[];
}

// Custom error class to track if error was retried
export class RetryableError extends Error {
  public retried: boolean;
  public isTransient: boolean;
  
  constructor(message: string, retried: boolean = false, isTransient: boolean = true) {
    super(message);
    this.name = 'RetryableError';
    this.retried = retried;
    this.isTransient = isTransient;
  }
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Set authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
}

/**
 * API Client class for making HTTP requests
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request with automatic retry for transient errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 2,
    delay: number = 1000
  ): Promise<ApiResponse<T>> {
    // Always get fresh token for each request to avoid stale token issues
    // This is critical - token might be refreshed between requests
    let token = getAuthToken();
    
    // If token is null/undefined, try to get it again (race condition protection)
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Always include Authorization header if token exists
    // This ensures token is sent even if it was just refreshed
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // If no token and this is not a public endpoint, we should not make the request
      // Public endpoints are handled by the backend, but most endpoints require auth
      // Don't log warning for public endpoints
      const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/evaluation-periods/open'];
      const isPublic = publicEndpoints.some(ep => endpoint.includes(ep));
      if (!isPublic) {
        // Token is missing for a protected endpoint - this is a real error
        // But we'll let the backend handle it and return proper error
        // The backend will return 401 which will trigger retry logic
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    let lastResponseStatus: number | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Suppress console errors for retryable requests that will be retried
        // Browser will still log HTTP errors, but we can catch and handle them silently
        const response = await fetch(url, {
          ...options,
          headers,
        }).catch((fetchError) => {
          // If fetch fails (network error), this is retryable
          // Don't let browser console show this as an unhandled error
          throw fetchError;
        });

                // Store response status for retry logic
                lastResponseStatus = response.status;

                // Read response text once (can only be read once)
                const responseText = await response.text();

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          if (response.ok) {
            return {
              success: true,
              message: 'Success',
              data: responseText as unknown as T,
            };
          }
          // Handle HTTP errors with non-JSON response
          if (response.status === 401) {
            throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
          }
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again later.');
          }
          throw new Error(responseText || `HTTP ${response.status}`);
        }

        // Try to parse JSON response
        let data: any;
        try {
          if (responseText) {
            data = JSON.parse(responseText);
          } else {
            data = {};
          }
        } catch (jsonError) {
          // If response is not valid JSON, create error based on status
          if (response.status === 401) {
            throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
          }
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again later.');
          }
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.ok) {
          // Handle specific HTTP status codes
          if (response.status === 401) {
            // Unauthorized - usually means wrong credentials
            // Use backend message if available, otherwise default message
            const message = data?.message || data?.errors?.[0] || 'Sai tên đăng nhập hoặc mật khẩu.';
            throw new Error(message);
          }
          if (response.status === 403) {
            throw new Error(data?.message || data?.errors?.[0] || 'Bạn không có quyền truy cập.');
          }
          if (response.status === 404) {
            throw new Error(data?.message || data?.errors?.[0] || 'Không tìm thấy tài nguyên.');
          }
          if (response.status === 500) {
            throw new Error(data?.message || data?.errors?.[0] || 'Lỗi server. Vui lòng thử lại sau.');
          }
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again later.');
          }
          // Use backend error message if available
          const errorMessage = data?.message || data?.errors?.[0] || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        return data;
      } catch (error) {
        // Get error message for retry logic
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is a retryable error
        // Retryable: 500, 503, network errors (TypeError from fetch)
        // Not retryable: 401, 403, 404, and other client errors
        const isRetryable = 
          // Network errors (fetch failed, connection refused, etc.) - always retryable
          (error instanceof TypeError) ||
          // Server errors that might be transient (check lastResponseStatus)
          (lastResponseStatus === 500 || lastResponseStatus === 503) ||
          // Error messages indicating retryable conditions
          (error instanceof Error && (
            errorMessage.includes('500') ||
            errorMessage.includes('503') ||
            errorMessage.includes('Connection refused') ||
            errorMessage.includes('Lỗi server') ||
            errorMessage.includes('Service temporarily unavailable')
          ));

        // If this is the last attempt or error is not retryable, throw the error
        // Note: If retry succeeds, we return data and never reach here
        // So any error thrown here is a real failure after all retries
        if (attempt === retries || !isRetryable) {
          // Handle network errors (fetch failed, CORS, etc.)
          if (error instanceof TypeError) {
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
              throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend services đang chạy (docker-compose ps)\n2. Gateway đang chạy trên http://localhost:8080\n3. Bạn đã đăng nhập và có token hợp lệ');
            }
            if (error.message.includes('CORS')) {
              throw new Error('Lỗi CORS. Vui lòng kiểm tra cấu hình Gateway.');
            }
          }
          
          // Re-throw existing errors (non-retryable or all retries exhausted)
          // If we reach here, it means all retries failed - this is a real error
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Đã xảy ra lỗi không xác định.');
        }

        // Wait before retrying (exponential backoff)
        // Don't log retry attempts - they're expected and will succeed
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Request failed after all retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// ==================== Evaluation Period APIs ====================

import type { EvaluationPeriod, CreateEvaluationPeriodRequest, UpdateEvaluationPeriodRequest } from '@/types/evaluation';

/**
 * Get currently open evaluation period
 */
export async function getOpenPeriod(): Promise<ApiResponse<EvaluationPeriod>> {
  return apiClient.get<EvaluationPeriod>('/evaluation-periods/open');
}

/**
 * Get all active evaluation periods
 */
export async function getAllEvaluationPeriods(): Promise<ApiResponse<EvaluationPeriod[]>> {
  return apiClient.get<EvaluationPeriod[]>('/evaluation-periods');
}

/**
 * Get evaluation period by ID
 */
export async function getEvaluationPeriodById(id: number): Promise<ApiResponse<EvaluationPeriod>> {
  return apiClient.get<EvaluationPeriod>(`/evaluation-periods/${id}`);
}

/**
 * Create new evaluation period (ADMIN, INSTITUTE_COUNCIL only)
 */
export async function createEvaluationPeriod(
  request: CreateEvaluationPeriodRequest
): Promise<ApiResponse<EvaluationPeriod>> {
  return apiClient.post<EvaluationPeriod>('/evaluation-periods', request);
}

/**
 * Update evaluation period (ADMIN, INSTITUTE_COUNCIL only)
 */
export async function updateEvaluationPeriod(
  id: number,
  request: UpdateEvaluationPeriodRequest
): Promise<ApiResponse<EvaluationPeriod>> {
  return apiClient.put<EvaluationPeriod>(`/evaluation-periods/${id}`, request);
}

/**
 * Deactivate evaluation period (ADMIN, INSTITUTE_COUNCIL only)
 */
export async function deactivateEvaluationPeriod(id: number): Promise<ApiResponse<string>> {
  return apiClient.delete<string>(`/evaluation-periods/${id}`);
}

/**
 * Get periods by semester
 */
export async function getPeriodsBySemester(semester: string): Promise<ApiResponse<EvaluationPeriod[]>> {
  return apiClient.get<EvaluationPeriod[]>(`/evaluation-periods/semester/${semester}`);
}

/**
 * Get periods by academic year
 */
export async function getPeriodsByAcademicYear(academicYear: string): Promise<ApiResponse<EvaluationPeriod[]>> {
  return apiClient.get<EvaluationPeriod[]>(`/evaluation-periods/academic-year/${academicYear}`);
}


/**
 * Get all rubrics
 */
export async function getAllRubrics(): Promise<ApiResponse<any[]>> {
  return apiClient.get<any[]>('/rubrics');
}

/**
 * Get rubric by ID
 */
export async function getRubricById(id: number): Promise<ApiResponse<any>> {
  return apiClient.get<any>(`/rubrics/${id}`);
}
