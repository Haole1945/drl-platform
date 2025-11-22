"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getAllTrainingPoints,
  createTrainingPoint,
  updateTrainingPoint,
  deleteTrainingPoint,
  type TrainingPoint,
  type CreateTrainingPointRequest,
} from '@/lib/training-points';
import { Loader2, Plus, Edit, Trash2, Award, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function TrainingPointsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trainingPoints, setTrainingPoints] = useState<TrainingPoint[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<TrainingPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<TrainingPoint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateTrainingPointRequest>({
    activityName: '',
    description: '',
    activityDate: new Date().toISOString().split('T')[0],
    points: 0,
    evidenceUrl: '',
    semester: '',
    studentCode: '',
  });

  useEffect(() => {
    loadTrainingPoints();
  }, [currentPage]);

  const loadTrainingPoints = async () => {
    try {
      setLoading(true);
      const response = await getAllTrainingPoints(currentPage, 20);
      if (response.success && response.data) {
        setTrainingPoints(response.data.content);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách điểm rèn luyện",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (point?: TrainingPoint) => {
    if (point) {
      setEditingPoint(point);
      setFormData({
        activityName: point.activityName,
        description: point.description || '',
        activityDate: point.activityDate,
        points: point.points,
        evidenceUrl: point.evidenceUrl || '',
        semester: point.semester,
        studentCode: point.studentCode,
      });
    } else {
      setEditingPoint(null);
      setFormData({
        activityName: '',
        description: '',
        activityDate: new Date().toISOString().split('T')[0],
        points: 0,
        evidenceUrl: '',
        semester: '',
        studentCode: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPoint(null);
  };

  const handleSubmit = async () => {
    if (!formData.activityName || !formData.studentCode || !formData.semester) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingPoint) {
        await updateTrainingPoint(editingPoint.id, formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật điểm rèn luyện",
        });
      } else {
        await createTrainingPoint(formData);
        toast({
          title: "Thành công",
          description: "Đã tạo điểm rèn luyện mới",
        });
      }
      handleCloseDialog();
      loadTrainingPoints();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu điểm rèn luyện",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPoint) return;

    try {
      await deleteTrainingPoint(deletingPoint.id);
      toast({
        title: "Thành công",
        description: "Đã xóa điểm rèn luyện",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPoint(null);
      loadTrainingPoints();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa điểm rèn luyện",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Điểm Rèn Luyện</h1>
              <p className="text-muted-foreground">
                Quản lý điểm rèn luyện của sinh viên
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Điểm
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trainingPoints.map((point) => (
              <Card key={point.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{point.activityName}</CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3" />
                          {point.studentCode} - {point.studentName}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant={point.points >= 0 ? "default" : "destructive"}>
                      <Award className="mr-1 h-3 w-3" />
                      {point.points} điểm
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {point.description && (
                      <p className="text-sm text-muted-foreground">{point.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(point.activityDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline">{point.semester}</Badge>
                    </div>
                    {point.evidenceUrl && (
                      <a
                        href={point.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Xem minh chứng →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(point)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingPoint(point);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {trainingPoints.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Chưa có điểm rèn luyện nào. Hãy thêm điểm mới.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Trang trước
              </Button>
              <span className="flex items-center px-4">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Trang sau
              </Button>
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPoint ? 'Chỉnh sửa Điểm Rèn Luyện' : 'Thêm Điểm Rèn Luyện Mới'}
                </DialogTitle>
                <DialogDescription>
                  Điền thông tin hoạt động và điểm rèn luyện của sinh viên
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentCode">Mã sinh viên *</Label>
                    <Input
                      id="studentCode"
                      value={formData.studentCode}
                      onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                      placeholder="N21DCCN001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="semester">Học kỳ *</Label>
                    <Input
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="2024-2025-HK1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="activityName">Tên hoạt động *</Label>
                  <Input
                    id="activityName"
                    value={formData.activityName}
                    onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                    placeholder="Ví dụ: Tham gia hoạt động tình nguyện"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về hoạt động..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activityDate">Ngày hoạt động *</Label>
                    <Input
                      id="activityDate"
                      type="date"
                      value={formData.activityDate}
                      onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="points">Điểm *</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="evidenceUrl">Link minh chứng</Label>
                  <Input
                    id="evidenceUrl"
                    value={formData.evidenceUrl}
                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa điểm rèn luyện "{deletingPoint?.activityName}"?
                  Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingPoint(null)}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
