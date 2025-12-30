import { getAuthToken } from '../api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

export interface SignatureData {
  signatureUrl: string;
  uploadedAt: string;
  hash?: string;
  hasSignature: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Upload signature image file
 */
export async function uploadSignature(file: File): Promise<ApiResponse<SignatureData>> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/auth/signature/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload signature');
  }

  return response.json();
}

/**
 * Save drawn signature (base64 data)
 */
export async function saveDrawnSignature(imageData: string): Promise<ApiResponse<SignatureData>> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/signature/draw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save signature');
  }

  return response.json();
}

/**
 * Get current user's signature
 */
export async function getSignature(): Promise<ApiResponse<SignatureData>> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/signature`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get signature');
  }

  return response.json();
}

/**
 * Delete signature
 */
export async function deleteSignature(): Promise<ApiResponse<void>> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/signature`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete signature');
  }

  return response.json();
}
