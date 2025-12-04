"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ClipboardList, Award, CheckSquare, Users, Settings, FileText, Trash2, Loader2 } from 'lucide-react';
import { hasAnyRole, getPrimaryRoleDisplayName, canCreateEvaluation, canApproveClassLevel, canApproveFacultyLevel, canApproveCtsvLevel } from '@/lib/role-utils';
import { getStudentEvaluations, getPendingEvaluations, deleteEvaluation } from '@/lib/evaluation';
import type { Evaluation } from '@/types/evaluation';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load my evaluations if student
        if (user.studentCode) {
          try {
            const evalsResponse = await getStudentEvaluations(user.studentCode);
            if (evalsResponse.success && evalsResponse.data) {
              setMyEvaluations(evalsResponse.data);
            }
          } catch (error: any) {
            // Handle case where student doesn't exist in student-service database
            // This can happen if user was created but student data wasn't seeded
            if (error?.message?.includes('not found') || error?.message?.includes('Student')) {
              // Don't show error to user - student can still use the system
              setMyEvaluations([]);
            } else {
              throw error; // Re-throw other errors
            }
          }
        }

        // Load pending count if can approve
        if (canApproveClassLevel(user) || canApproveFacultyLevel(user) || canApproveCtsvLevel(user)) {
          const pendingResponse = await getPendingEvaluations({ size: 1 });
          if (pendingResponse.success && pendingResponse.data) {
            setPendingCount(pendingResponse.data.totalElements || 0);
          }
        }
      } catch (error) {
        // API client handles retries automatically
        // Only log if it's a persistent error after retries
        // Most transient errors are handled by retry logic
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const canCreate = user && canCreateEvaluation(user);
  const canApprove = user && (canApproveClassLevel(user) || canApproveFacultyLevel(user) || canApproveCtsvLevel(user));
  const isAdmin = user && hasAnyRole(user, ['ADMIN']);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Chào mừng trở lại, {user?.fullName || user?.username}!
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {canCreate && (
              <Card>
                <CardHeader>
                  <CardTitle>Tạo Đánh giá Mới</CardTitle>
                  <CardDescription>
                    Tạo phiếu đánh giá điểm rèn luyện mới
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/evaluations/new">
                    <Button className="w-full">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Tạo Đánh giá
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {user?.studentCode && (
              <Card>
                <CardHeader>
                  <CardTitle>Đánh giá Của Tôi</CardTitle>
                  <CardDescription>
                    Xem lịch sử đánh giá của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/evaluations/my">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Xem Đánh giá ({myEvaluations.length})
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {canApprove && (
              <Card>
                <CardHeader>
                  <CardTitle>Chờ Duyệt</CardTitle>
                  <CardDescription>
                    Xem các đánh giá đang chờ duyệt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/approvals">
                    <Button variant="outline" className="w-full">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Xem Chờ Duyệt {pendingCount > 0 && `(${pendingCount})`}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {canApprove && (
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý Sinh viên</CardTitle>
                  <CardDescription>
                    Xem và quản lý thông tin sinh viên
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/students">
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Quản lý Sinh viên
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Quản trị</CardTitle>
                  <CardDescription>
                    Quản lý hệ thống và cấu hình
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Quản trị
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {myEvaluations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Đánh giá Gần Đây</CardTitle>
                    <CardDescription>
                      Hiển thị {Math.min(5, myEvaluations.length)} đánh giá gần đây nhất
                    </CardDescription>
                  </div>
                  <Link href="/evaluations/my">
                    <Button variant="ghost" size="sm">
                      Xem tất cả
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myEvaluations.slice(0, 5).map((evaluation) => {
                    const canDelete = evaluation.status === 'DRAFT';
                    return (
                      <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                        <Link 
                          href={`/evaluations/${evaluation.id}`} 
                          className="flex-1"
                          onClick={(e) => {
                            // Prevent navigation if clicking on delete button area
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('[role="dialog"]')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div>
                            <div className="font-medium">{evaluation.semester}</div>
                            <div className="text-sm text-muted-foreground">
                              Điểm: {Math.round(evaluation.totalPoints || evaluation.totalScore || 0)} / {evaluation.maxScore || evaluation.rubricName || 'N/A'}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={evaluation.status} />
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    // Stop propagation to prevent Link navigation
                                    e.stopPropagation();
                                  }}
                                  onMouseDown={(e) => {
                                    // Prevent Link navigation when clicking delete button
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  disabled={deletingId === evaluation.id}
                                  type="button"
                                >
                                  {deletingId === evaluation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa đánh giá "{evaluation.semester}"? 
                                    Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    type="button"
                                  >
                                    Hủy
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDeletingId(evaluation.id);
                                      try {
                                        const response = await deleteEvaluation(evaluation.id);
                                        if (response.success) {
                                          toast({
                                            title: "Thành công",
                                            description: "Đánh giá đã được xóa.",
                                          });
                                          // Reload evaluations
                                          if (user?.studentCode) {
                                            const evalsResponse = await getStudentEvaluations(user.studentCode);
                                            if (evalsResponse.success && evalsResponse.data) {
                                              setMyEvaluations(evalsResponse.data);
                                            }
                                          }
                                        } else {
                                          throw new Error(response.message || "Không thể xóa đánh giá");
                                        }
                                      } catch (error: any) {
                                        // Error already handled by toast notification
                                        toast({
                                          title: "Lỗi",
                                          description: error.message || "Không thể xóa đánh giá. Chỉ có thể xóa đánh giá ở trạng thái Nháp.",
                                          variant: "destructive"
                                        });
                                      } finally {
                                        setDeletingId(null);
                                      }
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    type="button"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

