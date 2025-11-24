"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { AlertCircle, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import type { EvaluationHistory } from '@/types/evaluation';

interface EvaluationHistoryProps {
  history: EvaluationHistory[];
  resubmissionCount?: number;
}

export function EvaluationHistory({ history, resubmissionCount }: EvaluationHistoryProps) {
  if (!history || history.length === 0) {
    return null;
  }

  // Filter and sort history
  const rejectionHistory = history
    .filter(item => item.action === 'REJECTED' || item.action === 'RESUBMITTED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (rejectionHistory.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
    } catch {
      return 'N/A';
    }
  };

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
      'FACULTY': { label: 'Khoa', variant: 'secondary' },
      'CTSV': { label: 'CTSV', variant: 'default' },
    };

    const config = levelMap[level] || { label: level, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Lịch sử Từ chối & Nộp lại
        </CardTitle>
        <CardDescription>
          {resubmissionCount ? `Đã nộp lại ${resubmissionCount} lần` : 'Lịch sử các lần từ chối và nộp lại'}
        </CardDescription>
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
                          {formatDate(item.createdAt)}
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
        
        {/* Summary */}
        {resubmissionCount && resubmissionCount > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Tổng cộng đã nộp lại {resubmissionCount} lần</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
