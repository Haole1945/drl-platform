'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AiScoringResponse, SubCriteriaInfo } from '@/types/ai-scoring';
import { getScoringsuggestion } from '@/lib/api/ai-scoring';

interface AiScoringSuggestionCompactProps {
  criteriaId: number;
  maxScore: number;
  evidenceFileIds: number[];
  currentScore?: number;
  token: string;
  subCriteria?: SubCriteriaInfo[]; // Thông tin sub-criteria để AI phân tích riêng
}

export function AiScoringSuggestionCompact({
  criteriaId,
  maxScore,
  evidenceFileIds,
  currentScore = 0,
  token,
  subCriteria,
}: AiScoringSuggestionCompactProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiScoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    console.log('[AI-SCORING] Starting AI analysis...', {
      criteriaId,
      maxScore,
      evidenceFileIds,
      fileCount: evidenceFileIds.length,
      hasSubCriteria: !!subCriteria,
      subCriteriaCount: subCriteria?.length || 0
    });
    
    if (evidenceFileIds.length === 0) {
      console.warn('[AI-SCORING] No evidence files');
      setError('Cần có minh chứng để AI phân tích');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      console.log('[AI-SCORING] Calling getScoringsuggestion...');
      const response = await getScoringsuggestion(
        { criteriaId, evidenceFileIds, maxScore, subCriteria },
        token
      );
      console.log('[AI-SCORING] Got response:', response);
      setSuggestion(response);
    } catch (err: any) {
      console.error('[AI-SCORING] Error:', err);
      setError(err.message || 'Lỗi khi gọi AI');
    } finally {
      setLoading(false);
    }
  };

  const scoreDifference = suggestion ? suggestion.suggestedScore - currentScore : 0;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
      {/* Header với nút */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Gợi ý AI</span>
        </div>

        {!suggestion && !loading && (
          <Button
            onClick={handleGetSuggestion}
            size="sm"
            className="h-7 px-2 text-xs bg-purple-600 hover:bg-purple-700"
            disabled={loading || evidenceFileIds.length === 0}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Phân tích
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-purple-600 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Đang phân tích...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded p-2">
          {error}
        </div>
      )}

      {/* Kết quả - CHỈ hiển thị điểm từng sub-criteria có file */}
      {suggestion && (
        <div className="space-y-2">
          {/* Kết quả theo sub-criteria (CHỈ các sub-criteria có bằng chứng) */}
          {suggestion.subCriteriaScores && suggestion.subCriteriaScores.length > 0 ? (
            <div className="bg-white rounded p-2 space-y-1">
              {suggestion.subCriteriaScores.map((subScore) => (
                <div key={subScore.subCriteriaId} className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-gray-700">
                    {subScore.subCriteriaId}
                  </span>
                  <div className="flex items-center gap-2" title="Evidence verified">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-purple-700">
                      {subScore.suggestedScore}/{subScore.maxScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback nếu không có sub-criteria scores (old format)
            <div className="bg-white rounded p-2 text-xs text-center text-gray-500">
              Không có dữ liệu
            </div>
          )}

          {/* Nút làm mới */}
          <div className="flex justify-center">
            <Button onClick={() => setSuggestion(null)} size="sm" variant="ghost" className="h-7 text-xs text-gray-500">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
