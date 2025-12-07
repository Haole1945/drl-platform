"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { getStudentByCode, type Student } from '@/lib/student';
import { getStudentEvaluations as getEvals } from '@/lib/evaluation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Evaluation } from '@/types/evaluation';
import { StatusBadge } from '@/components/StatusBadge';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const studentCode = params?.studentCode as string;

  useEffect(() => {
    if (!studentCode) {
      router.push('/students');
      return;
    }

    const loadData = async () => {
      try {
        const [studentResponse, evalsResponse] = await Promise.all([
          getStudentByCode(studentCode),
          getEvals(studentCode)
        ]);

        if (studentResponse.success && studentResponse.data) {
          setStudent(studentResponse.data);
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy sinh viên.",
            variant: "destructive"
          });
          router.push('/students');
        }

        if (evalsResponse.success && evalsResponse.data) {
          setEvaluations(evalsResponse.data);
        }
      } catch (error: any) {
        // API client handles retries automatically
        // Only log persistent errors after all retries
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải thông tin sinh viên.",
          variant: "destructive"
        });
        router.push('/students');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentCode, router, toast]);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return null;
  }

  const getPositionBadge = (position?: string) => {
    if (!position || position === 'NONE') return <Badge variant="outline">Không có</Badge>;
    const positionMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'CLASS_MONITOR': { label: 'Lớp trưởng', variant: 'default' },
      'VICE_MONITOR': { label: 'Lớp phó', variant: 'secondary' },
      'SECRETARY': { label: 'Bí thư', variant: 'outline' },
    };
    const config = positionMap[position] || { label: position, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/students">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết Sinh viên</h1>
              <p className="text-muted-foreground">
                {student.studentCode} - {student.fullName}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Mã sinh viên</div>
                  <div className="text-lg font-semibold">{student.studentCode}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Họ và Tên</div>
                  <div className="text-lg">{student.fullName}</div>
                </div>
                {student.dateOfBirth && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ngày sinh</div>
                    <div>{new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}</div>
                  </div>
                )}
                {student.gender && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Giới tính</div>
                    <div>{student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : student.gender}</div>
                  </div>
                )}
                {student.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Số điện thoại</div>
                    <div>{student.phone}</div>
                  </div>
                )}
                {student.address && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Địa chỉ</div>
                    <div>{student.address}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin Học tập</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Lớp</div>
                  <div className="text-lg">{student.className || student.classCode || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Ngành</div>
                  <div className="text-lg">{student.majorName || student.majorCode || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Khoa</div>
                  <div className="text-lg">{student.facultyName || student.facultyCode || '-'}</div>
                </div>
                {student.academicYear && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Niên khóa</div>
                    <div>{student.academicYear}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Chức vụ</div>
                  <div>{getPositionBadge(student.position)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử Đánh giá</CardTitle>
              <CardDescription>
                Các đánh giá điểm rèn luyện của sinh viên này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Sinh viên này chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <Link key={evaluation.id} href={`/evaluations/${evaluation.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div>
                          <div className="font-medium">{evaluation.semester}</div>
                          <div className="text-sm text-muted-foreground">
                            Điểm: {(evaluation.totalPoints || evaluation.totalScore || 0).toFixed(1)} / {evaluation.maxScore || 'N/A'}
                          </div>
                        </div>
                        <StatusBadge status={evaluation.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

