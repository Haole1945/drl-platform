'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { AiScoringResponse } from '@/types/ai-scoring';
import { getScoringsuggestion } from '@/lib/api/ai-scoring';

interface AiScoringSuggestionCompactProps {
  criteriaId: number;
  maxScore: number;
  evidenceFileIds: number[];
  currentScore?: number;
  token: string;
}

export function AiScoringSuggestionCompact({
  criteriaId,
  maxScore,
  evidenceFileIds,
  currentScore = 0,
  token,
}: AiScoringSuggestionCompactProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiScoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    if (evidenceFileIds.length === 0) {
      setError('Cần có minh chứng để AI phân tích');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await getScoringsuggestion(
        { criteriaId, evidenceFileIds, maxScore },
        token
      );
      setSuggestion(response);
    } catch (err: any) {
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

      {/* Kết quả */}
      {suggestion && (
        <div className="space-y-2">
          {/* Điểm */}
          <div className="flex items-center justify-between bg-white rounded p-2">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-600">Điểm sinh viên tự chấm</div>
              <div className="font-semibold text-gray-600">{currentScore}<span className="text-gray-600 text-xs">/{maxScore}</span></div>
            </div>
            <div className="text-center flex-1 bg-purple-50 rounded py-1">
              <div className="text-xs text-purple-600">Điểm AI gợi ý</div>
              <div className="font-semibold text-purple-700">{suggestion.suggestedScore}<span className="text-purple-400 text-xs">/{maxScore}</span></div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500">Chênh lệch</div>
              <div className={`font-semibold ${scoreDifference > 0 ? 'text-green-600' : scoreDifference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {scoreDifference > 0 ? '+' : ''}{scoreDifference.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Độ tin cậy + Lý do */}
          <div className="bg-white rounded p-2 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500">Độ tin cậy</span>
              <Badge variant="secondary" className="text-xs h-5">
                {suggestion.confidence}%
              </Badge>
            </div>
            <p className="text-gray-600 line-clamp-2">{suggestion.reason}</p>
          </div>

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
