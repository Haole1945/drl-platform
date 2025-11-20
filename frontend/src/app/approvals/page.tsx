"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, CheckSquare } from 'lucide-react';
import { getPendingEvaluations } from '@/lib/evaluation';
import { canApproveClassLevel, canApproveFacultyLevel, canApproveCtsvLevel } from '@/lib/role-utils';
import type { Evaluation } from '@/types/evaluation';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;

    const loadPendingEvaluations = async () => {
      try {
        let level: string | undefined;
        if (canApproveClassLevel(user)) {
          level = activeTab === 'class' ? 'CLASS' : undefined;
        } else if (canApproveFacultyLevel(user)) {
          level = activeTab === 'faculty' ? 'FACULTY' : undefined;
        } else if (canApproveCtsvLevel(user)) {
          level = activeTab === 'ctsv' ? 'CTSV' : undefined;
        }

        const response = await getPendingEvaluations({ level, size: 100 });
        if (response.success && response.data) {
          setEvaluations(response.data.content || []);
        }
      } catch (error) {
        // API client handles retries automatically
        // Only log persistent errors after all retries
      } finally {
        setLoading(false);
      }
    };

    loadPendingEvaluations();
  }, [user, activeTab]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['CLASS_MONITOR', 'UNION_REPRESENTATIVE', 'ADVISOR', 'FACULTY_INSTRUCTOR', 'CTSV_STAFF', 'INSTITUTE_COUNCIL', 'ADMIN']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const canApprove = user && (canApproveClassLevel(user) || canApproveFacultyLevel(user) || canApproveCtsvLevel(user));

  if (!canApprove) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const classLevel = evaluations.filter(e => e.status === 'SUBMITTED');
  const facultyLevel = evaluations.filter(e => e.status === 'CLASS_APPROVED');
  const ctsvLevel = evaluations.filter(e => e.status === 'FACULTY_APPROVED');

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Duyệt Đánh giá</h1>
            <p className="text-muted-foreground">
              Xem và duyệt các đánh giá đang chờ xử lý
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tất cả ({evaluations.length})</TabsTrigger>
              {canApproveClassLevel(user) && (
                <TabsTrigger value="class">Cấp Lớp ({classLevel.length})</TabsTrigger>
              )}
              {canApproveFacultyLevel(user) && (
                <TabsTrigger value="faculty">Cấp Khoa ({facultyLevel.length})</TabsTrigger>
              )}
              {canApproveCtsvLevel(user) && (
                <TabsTrigger value="ctsv">Cấp CTSV ({ctsvLevel.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {evaluations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có đánh giá nào chờ duyệt</p>
                  </CardContent>
                </Card>
              ) : (
                evaluations.map((evaluation) => (
                  <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                ))
              )}
            </TabsContent>

            {canApproveClassLevel(user) && (
              <TabsContent value="class" className="space-y-4">
                {classLevel.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">Không có đánh giá nào chờ duyệt cấp lớp</p>
                    </CardContent>
                  </Card>
                ) : (
                  classLevel.map((evaluation) => (
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))
                )}
              </TabsContent>
            )}

            {canApproveFacultyLevel(user) && (
              <TabsContent value="faculty" className="space-y-4">
                {facultyLevel.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">Không có đánh giá nào chờ duyệt cấp khoa</p>
                    </CardContent>
                  </Card>
                ) : (
                  facultyLevel.map((evaluation) => (
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))
                )}
              </TabsContent>
            )}

            {canApproveCtsvLevel(user) && (
              <TabsContent value="ctsv" className="space-y-4">
                {ctsvLevel.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">Không có đánh giá nào chờ duyệt cấp CTSV</p>
                    </CardContent>
                  </Card>
                ) : (
                  ctsvLevel.map((evaluation) => (
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{evaluation.semester}</CardTitle>
            <CardDescription>
              Mã SV: {evaluation.studentCode} - {evaluation.academicYear || 'Năm học chưa xác định'}
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
                Nộp: {new Date(evaluation.submittedAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
          <Link href={`/evaluations/${evaluation.id}`}>
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Xem & Duyệt
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

