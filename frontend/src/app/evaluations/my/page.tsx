"use client";

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { getStudentEvaluations } from '@/lib/evaluation';
import type { Evaluation } from '@/types/evaluation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, Calendar, Award, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MyEvaluationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadEvaluations = async () => {
      if (!user?.studentCode) {
        setLoading(false);
        return;
      }

      try {
        const response = await getStudentEvaluations(user.studentCode);
        if (response.success && response.data) {
          // Sort by created date (newest first)
          const sorted = [...response.data].sort((a, b) => {
            const dateA = Array.isArray(a.createdAt) 
              ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2], a.createdAt[3] || 0, a.createdAt[4] || 0, a.createdAt[5] || 0)
              : new Date(a.createdAt || 0);
            const dateB = Array.isArray(b.createdAt)
              ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2], b.createdAt[3] || 0, b.createdAt[4] || 0, b.createdAt[5] || 0)
              : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          setEvaluations(sorted);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải danh sách đánh giá.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [user, toast]);

  // Filter evaluations based on search query and status
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      // Status filter
      if (statusFilter !== 'all' && evaluation.status !== statusFilter) {
        return false;
      }

      // Search filter (search in semester, academicYear, status)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSemester = evaluation.semester?.toLowerCase().includes(query);
        const matchesAcademicYear = evaluation.academicYear?.toLowerCase().includes(query);
        const matchesStatus = evaluation.status?.toLowerCase().includes(query);
        const matchesRubric = evaluation.rubricName?.toLowerCase().includes(query);
        
        if (!matchesSemester && !matchesAcademicYear && !matchesStatus && !matchesRubric) {
          return false;
        }
      }

      return true;
    });
  }, [evaluations, searchQuery, statusFilter]);

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

  if (!user?.studentCode) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Chỉ sinh viên mới có thể xem đánh giá của mình.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Đánh giá Của Tôi</h1>
            <p className="text-muted-foreground">
              Xem tất cả đánh giá của bạn từ xưa đến nay
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm và Lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Tìm theo học kỳ, năm học, rubric..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="DRAFT">Nháp</SelectItem>
                      <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
                      <SelectItem value="CLASS_APPROVED">Lớp đã duyệt</SelectItem>
                      <SelectItem value="ADVISOR_APPROVED">Cố vấn đã duyệt</SelectItem>
                      <SelectItem value="FACULTY_APPROVED">Khoa đã duyệt</SelectItem>
                      <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>
                Kết quả ({filteredEvaluations.length} đánh giá)
              </CardTitle>
              <CardDescription>
                {filteredEvaluations.length === 0 
                  ? "Không tìm thấy đánh giá nào."
                  : `Hiển thị ${filteredEvaluations.length} đánh giá`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEvaluations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all'
                      ? "Không tìm thấy đánh giá phù hợp với bộ lọc."
                      : "Bạn chưa có đánh giá nào. Hãy tạo đánh giá mới!"}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Link href="/evaluations/new">
                      <Button className="mt-4">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Tạo Đánh giá Mới
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvaluations.map((evaluation) => (
                    <Link
                      key={evaluation.id}
                      href={`/evaluations/${evaluation.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{evaluation.semester}</span>
                            {evaluation.academicYear && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  {evaluation.academicYear}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <span>
                                Điểm: {Math.round(evaluation.totalPoints || evaluation.totalScore || 0)} / {evaluation.maxScore || 'N/A'}
                              </span>
                            </div>
                            {evaluation.rubricName && (
                              <>
                                <span>•</span>
                                <span>{evaluation.rubricName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={evaluation.status} />
                        </div>
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

