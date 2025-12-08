"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date-utils';
import { AlertCircle, CheckCircle, Clock, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { EvaluationHistory } from '@/types/evaluation';

interface EvaluationHistoryProps {
  history: EvaluationHistory[];
  resubmissionCount?: number;
}

export function EvaluationHistory({ history, resubmissionCount }: EvaluationHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  // Helper to convert timestamp to Date
  const toDate = (dateValue?: string | number[]): Date => {
    if (!dateValue) return new Date(0);
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      // Backend stores in Vietnam timezone, create date directly
      // Month is 1-based in Java but 0-based in JavaScript
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return new Date(dateValue);
  };

  // Filter and sort history
  const allHistory = history
    .filter(item => item.action === 'REJECTED' || item.action === 'RESUBMITTED')
    .sort((a, b) => {
      const dateA = toDate(a.timestamp || a.createdAt).getTime();
      const dateB = toDate(b.timestamp || b.createdAt).getTime();
      return dateB - dateA;
    });

  if (allHistory.length === 0) {
    return null;
  }

  // Get only the latest rejection/resubmit pair
  const latestItems: typeof allHistory = [];
  const latest = allHistory[0];
  
  if (latest.action === 'RESUBMITTED') {
    // If latest is resubmit, find the rejection before it
    latestItems.push(latest);
    const rejection = allHistory.find((item, idx) => idx > 0 && item.action === 'REJECTED');
    if (rejection) {
      latestItems.push(rejection);
    }
  } else if (latest.action === 'REJECTED') {
    // If latest is rejection, check if there's a resubmit after it
    latestItems.push(latest);
    // No resubmit yet, just show rejection
  }

  // Show latest or all based on toggle
  const rejectionHistory = showAll ? allHistory : latestItems;
  const hasMore = allHistory.length > latestItems.length;

  // Use shared date utility for consistent formatting
  const formatDate = formatDateTime;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'RESUBMITTED':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string, level?: string) => {
    switch (action) {
      case 'REJECTED':
        return `Bị từ chối${level ? ` (${level})` : ''}`;
      case 'RESUBMITTED':
        return 'Đã nộp lại';
      default:
        return action;
    }
  };

  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    
    const levelMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'CLASS': { label: 'Lớp', variant: 'outline' },
      'ADVISOR': { label: 'Cố vấn', variant: 'secondary' },
      'FACULTY': { label: 'Khoa', variant: 'default' },
    };

    const config = levelMap[level] || { label: level, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Lịch sử Từ chối & Nộp lại
            </CardTitle>
            <CardDescription>
              {showAll 
                ? `Tất cả lịch sử (${allHistory.length} sự kiện)`
                : resubmissionCount && resubmissionCount > 0 
                  ? `Lần gần nhất (Tổng: ${resubmissionCount} lần nộp lại)` 
                  : 'Lần từ chối gần nhất'}
            </CardDescription>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Xem tất cả ({allHistory.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rejectionHistory.map((item, index) => (
            <div key={`${item.id}-${index}`} className="relative">
              {/* Timeline line */}
              {index < rejectionHistory.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
              )}
              
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 bg-background flex items-center justify-center">
                  {getActionIcon(item.action)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Alert variant={item.action === 'REJECTED' ? 'destructive' : 'default'} className="mb-0">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong>{getActionLabel(item.action, item.level)}</strong>
                          {item.level && getLevelBadge(item.level)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.timestamp || item.createdAt)}
                        </div>
                      </div>
                      
                      {/* Actor */}
                      {item.actorName && (
                        <div className="text-sm text-muted-foreground">
                          {item.action === 'REJECTED' ? 'Người từ chối:' : 'Người nộp:'} {item.actorName}
                        </div>
                      )}
                      
                      {/* Comment */}
                      {item.comment && (
                        <AlertDescription className="mt-2">
                          <strong>
                            {item.action === 'REJECTED' ? 'Lý do từ chối:' : 'Phản hồi:'}
                          </strong>
                          <div className="mt-1 text-sm">{item.comment}</div>
                        </AlertDescription>
                      )}
                    </div>
                  </Alert>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
