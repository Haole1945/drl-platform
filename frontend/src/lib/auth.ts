/**
 * Authentication API functions
 */

import { apiClient } from './api';
import type { ApiResponse } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RequestPasswordRequest,
  User,
} from '@/types/auth';
import { setAuthToken, removeAuthToken } from './api';

/**
 * Login user
 */
export async function login(
  credentials: LoginRequest
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  
  if (response.success && response.data?.accessToken) {
    setAuthToken(response.data.accessToken);
    if (response.data.refreshToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
  }
  
  return response;
}

/**
 * Register new user (DEPRECATED - Use requestPassword instead)
 */
export async function register(
  data: RegisterRequest
): Promise<ApiResponse<User>> {
  return apiClient.post<User>('/auth/register', data);
}

/**
 * Request password via email
 * Student enters their school email, system sends password
 */
export async function requestPassword(
  data: RequestPasswordRequest
): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/auth/request-password', data);
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiClient.get<User>('/auth/me');
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string
): Promise<ApiResponse<AuthResponse>> {
  const request: RefreshTokenRequest = { refreshToken };
  const response = await apiClient.post<AuthResponse>(
    '/auth/refresh',
    request
  );
  
  if (response.success && response.data?.accessToken) {
    setAuthToken(response.data.accessToken);
    if (response.data.refreshToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
  }
  
  return response;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Ignore errors on logout
    // Logout errors are usually not critical - user is already logged out
  } finally {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }
  }
}

/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/auth/change-password', data);
}

/**
 * User Management API functions (Admin only)
 */

export interface UserListParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/**
 * Get all users with pagination and filters
 */
export async function getAllUsers(params?: UserListParams): Promise<ApiResponse<UserListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  
  const query = queryParams.toString();
  return apiClient.get<UserListResponse>(`/auth/users${query ? `?${query}` : ''}`);
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<ApiResponse<User>> {
  return apiClient.get<User>(`/auth/users/${id}`);
}

/**
 * Activate user
 */
export async function activateUser(id: number): Promise<ApiResponse<User>> {
  return apiClient.put<User>(`/auth/users/${id}/activate`);
}

/**
 * Deactivate user
 */
export async function deactivateUser(id: number): Promise<ApiResponse<User>> {
  return apiClient.put<User>(`/auth/users/${id}/deactivate`);
}

/**
 * Update user roles
 */
export async function updateUserRoles(id: number, roleNames: string[]): Promise<ApiResponse<User>> {
  return apiClient.put<User>(`/auth/users/${id}/roles`, { roleNames });
}

/**
 * Get all available roles
 */
export async function getAllRoles(): Promise<ApiResponse<string[]>> {
  return apiClient.get<string[]>('/auth/users/roles');
}

