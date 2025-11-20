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

