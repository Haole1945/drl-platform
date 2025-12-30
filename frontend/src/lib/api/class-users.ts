import { apiClient } from '../api';

export interface UserSignature {
  username: string;
  fullName: string;
  email?: string;
  classCode?: string;
  signatureImageUrl?: string;
  signatureUploadedAt?: string;
}

export interface ClassKeyUsers {
  advisor: UserSignature | null;
  classMonitor: UserSignature | null;
}

/**
 * Get advisor (CVHT) for a specific class
 */
export async function getClassAdvisor(classCode: string) {
  return apiClient.get<UserSignature>(`/class-users/${classCode}/advisor`);
}

/**
 * Get class monitor for a specific class
 */
export async function getClassMonitor(classCode: string) {
  return apiClient.get<UserSignature>(`/class-users/${classCode}/monitor`);
}

/**
 * Get all key users (advisor + monitor) for a class
 */
export async function getClassKeyUsers(classCode: string) {
  return apiClient.get<ClassKeyUsers>(`/class-users/${classCode}/key-users`);
}

/**
 * Get user info for a student by student code (includes signature)
 */
export async function getStudentUser(studentCode: string) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';
  const url = `${API_BASE}/class-users/student/${studentCode}`;
  
  console.log('[CLASS-USERS-API] Fetching student user:', {
    studentCode,
    url,
    API_BASE,
  });
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[CLASS-USERS-API] Response status:', response.status);
    console.log('[CLASS-USERS-API] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CLASS-USERS-API] Error response:', errorText);
      return {
        success: false,
        message: `Failed to fetch student user: ${response.statusText}`,
        data: null as any,
      };
    }
    
    const data = await response.json();
    console.log('[CLASS-USERS-API] Success data:', data);
    return {
      success: true,
      message: 'Success',
      data,
    };
  } catch (error) {
    console.error('[CLASS-USERS-API] Fetch error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null as any,
    };
  }
}
