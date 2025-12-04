"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, FileText, Eye } from 'lucide-react';
import { getStudentEvaluations } from '@/lib/evaluation';
import type { Evaluation } from '@/types/evaluation';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';

export default function EvaluationsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvaluations = async () => {
      if (!user?.studentCode) {
        setLoading(false);
        return;
      }

      try {
        const response = await getStudentEvaluations(user.studentCode);
        if (response.success && response.data) {
          setEvaluations(response.data);
        }
      } catch (error) {
        // API client handles retries automatically
        // Only log persistent errors after all retries
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Đánh giá Điểm Rèn Luyện</h1>
              <p className="text-muted-foreground">
                Xem tất cả đánh giá của bạn
              </p>
            </div>
            <Link href="/evaluations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo Đánh giá Mới
              </Button>
            </Link>
          </div>

          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Bạn chưa có đánh giá nào</p>
                <Link href="/evaluations/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo Đánh giá Đầu tiên
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{evaluation.semester}</CardTitle>
                        <CardDescription>
                          {evaluation.academicYear || 'Năm học chưa xác định'}
                        </CardDescription>
                      </div>
                      <StatusBadge status={evaluation.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Tổng điểm:</span>{' '}
                          <Badge variant="outline">
                            {(evaluation.totalPoints || evaluation.totalScore || 0).toFixed(1)} điểm
                          </Badge>
                        </div>
                        {evaluation.submittedAt && (
                          <div className="text-sm text-muted-foreground">
                            Nộp: {(() => {
                              const date = Array.isArray(evaluation.submittedAt)
                                ? new Date(evaluation.submittedAt[0], evaluation.submittedAt[1] - 1, evaluation.submittedAt[2])
                                : new Date(evaluation.submittedAt);
                              return date.toLocaleDateString('vi-VN');
                            })()}
                          </div>
                        )}
                        {evaluation.rejectionReason && (
                          <div className="text-sm text-destructive mt-2">
                            <span className="font-medium">Lý do từ chối:</span> {evaluation.rejectionReason}
                          </div>
                        )}
                      </div>
                      <Link href={`/evaluations/${evaluation.id}`}>
                        <Button variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

