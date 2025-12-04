'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AiScoringResponse } from '@/types/ai-scoring';
import { getScoringsuggestion } from '@/lib/api/ai-scoring';

interface AiScoringSuggestionProps {
  criteriaId: number;
  maxScore: number;
  evidenceFileIds: number[];
  currentScore?: number;
  token: string;
}

export function AiScoringSuggestion({
  criteriaId,
  maxScore,
  evidenceFileIds,
  currentScore = 0,
  token,
}: AiScoringSuggestionProps) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTABLE': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECT': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const scoreDifference = suggestion ? suggestion.suggestedScore - currentScore : 0;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base">Gợi ý từ AI</CardTitle>
          </div>
          {suggestion && (
            <span className="text-xs text-gray-400">{suggestion.processingTimeMs}ms</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Nút phân tích */}
        {!suggestion && !loading && (
          <Button
            onClick={handleGetSuggestion}
            disabled={evidenceFileIds.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Phân tích minh chứng
          </Button>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-gray-600">Đang phân tích...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</div>
        )}

        {/* Kết quả */}
        {suggestion && (
          <div className="space-y-3">
            {/* Điểm số */}
            <div className="bg-white rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {getStatusIcon(suggestion.status)}
                  <span className="text-sm text-gray-600">Điểm đề xuất</span>
                </div>
                <Badge variant="secondary">{suggestion.confidence}%</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-purple-600">{suggestion.suggestedScore}</span>
                  <span className="text-gray-400">/{maxScore}</span>
                </div>
                {scoreDifference !== 0 && (
                  <span className={`text-sm font-medium ${scoreDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreDifference > 0 ? '+' : ''}{scoreDifference.toFixed(1)} so với tự chấm
                  </span>
                )}
              </div>
            </div>

            {/* Lý do */}
            <div className="bg-white rounded-lg border p-3">
              <p className="text-sm text-gray-700">{suggestion.reason}</p>
            </div>

            {/* Nút làm mới */}
            <div className="flex justify-center">
              <Button onClick={handleGetSuggestion} variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                Phân tích lại
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Gợi ý AI chỉ mang tính tham khảo
        </p>
      </CardContent>
    </Card>
  );
}

