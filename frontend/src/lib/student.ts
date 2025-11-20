/**
 * Student API functions
 */

import { apiClient } from './api';
import type { ApiResponse } from './api';

export interface Student {
  studentCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  academicYear?: string;
  position?: string;
  className?: string;
  classCode?: string;
  majorName?: string;
  majorCode?: string;
  facultyName?: string;
  facultyCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentListResponse {
  content: Student[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get all students with pagination and filters
 */
export async function getStudents(params?: {
  page?: number;
  size?: number;
  facultyCode?: string;
  majorCode?: string;
  classCode?: string;
  search?: string;
}): Promise<ApiResponse<StudentListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.facultyCode) queryParams.append('facultyCode', params.facultyCode);
  if (params?.majorCode) queryParams.append('majorCode', params.majorCode);
  if (params?.classCode) queryParams.append('classCode', params.classCode);
  
  const query = queryParams.toString();
  return apiClient.get(`/students${query ? `?${query}` : ''}`);
}

/**
 * Get student by code
 */
export async function getStudentByCode(studentCode: string): Promise<ApiResponse<Student>> {
  return apiClient.get(`/students/${studentCode}`);
}

/**
 * Create new student (ADMIN only)
 */
export async function createStudent(data: Partial<Student>): Promise<ApiResponse<Student>> {
  return apiClient.post<Student>('/students', data);
}

/**
 * Update student (ADMIN only)
 */
export async function updateStudent(
  studentCode: string,
  data: Partial<Student>
): Promise<ApiResponse<Student>> {
  return apiClient.put<Student>(`/students/${studentCode}`, data);
}

/**
 * Delete student (ADMIN only)
 */
export async function deleteStudent(studentCode: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/students/${studentCode}`);
}

