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

export interface Faculty {
  code: string;
  name: string;
  description?: string;
}

export interface Major {
  code: string;
  name: string;
  description?: string;
  facultyCode: string;
  facultyName: string;
}

export interface Class {
  code: string;
  name: string;
  academicYear: string;
  facultyCode: string;
  facultyName: string;
  majorCode?: string;
  majorName?: string;
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

/**
 * Get all faculties
 */
export async function getFaculties(): Promise<ApiResponse<Faculty[]>> {
  return apiClient.get<Faculty[]>('/students/faculties');
}

/**
 * Get majors by faculty code (optional)
 */
export async function getMajors(facultyCode?: string): Promise<ApiResponse<Major[]>> {
  const query = facultyCode ? `?facultyCode=${facultyCode}` : '';
  return apiClient.get<Major[]>(`/students/majors${query}`);
}

/**
 * Get classes by faculty code and optionally by major code
 */
export async function getClasses(facultyCode?: string, majorCode?: string): Promise<ApiResponse<Class[]>> {
  const params = new URLSearchParams();
  if (facultyCode) params.append('facultyCode', facultyCode);
  if (majorCode) params.append('majorCode', majorCode);
  const query = params.toString();
  return apiClient.get<Class[]>(`/students/classes${query ? `?${query}` : ''}`);
}

