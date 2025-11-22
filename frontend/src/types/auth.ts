/**
 * Authentication Types
 */

export type Role = 
  | 'STUDENT' 
  | 'CLASS_MONITOR' 
  | 'UNION_REPRESENTATIVE' 
  | 'ADVISOR' 
  | 'FACULTY_INSTRUCTOR' 
  | 'CTSV_STAFF' 
  | 'INSTITUTE_COUNCIL' 
  | 'INSTRUCTOR' 
  | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  studentCode?: string;
  classCode?: string; // Class code from student record (e.g., "D21DCCN01-N")
  role?: Role; // Single role (for backward compatibility)
  roles?: Role[]; // Multiple roles (new)
  isActive?: boolean; // Matches backend UserDTO.isActive
  enabled?: boolean; // Deprecated - use isActive instead
  createdAt?: string | number[]; // Can be string or array from LocalDateTime [year, month, day, hour, minute, second, nanosecond]
  updatedAt?: string | number[]; // Can be string or array from LocalDateTime [year, month, day, hour, minute, second, nanosecond]
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RequestPasswordRequest {
  email: string;
}

