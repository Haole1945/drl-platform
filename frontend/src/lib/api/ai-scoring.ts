/**
 * API Client cho AI Scoring
 */

import { AiScoringRequest, AiScoringResponse } from '@/types/ai-scoring';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * Gọi API để lấy gợi ý điểm từ AI
 */
export async function getScoringsuggestion(
  request: AiScoringRequest,
  token: string
): Promise<AiScoringResponse> {
  // Call Next.js API route to bypass CORS and backend issues
  const response = await fetch('/api/ai-scoring', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));

    // Nếu có error message trong data.reason (fallback response)
    if (errorData.data?.reason) {
      throw new Error(errorData.data.reason);
    }

    throw new Error(errorData.message || `HTTP ${response.status}: Failed to get AI suggestion`);
  }

  const result = await response.json();

  // Kiểm tra success flag
  if (!result.success) {
    throw new Error(result.data?.reason || result.message || 'AI scoring failed');
  }

  // Trả về data object chứa AiScoringResponse
  return result.data;
}

/**
 * Kiểm tra AI service có hoạt động không
 */
export async function checkAiServiceHealth(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('AI service health check failed:', error);
    return false;
  }
}

