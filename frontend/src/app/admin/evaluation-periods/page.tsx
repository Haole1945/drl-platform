"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllEvaluationPeriods, 
  createEvaluationPeriod, 
  updateEvaluationPeriod, 
  deactivateEvaluationPeriod,
  getAllRubrics
} from '@/lib/api';
import type { EvaluationPeriod, CreateEvaluationPeriodRequest, UpdateEvaluationPeriodRequest } from '@/types/evaluation';
import { Loader2, Plus, Edit, Trash2, Calendar } from 'lucide-react';
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
import { RubricTargetSelector } from '../system-config/components/RubricTargetSelector';
import type { Rubric } from '@/types/evaluation';

export default function EvaluationPeriodsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateEvaluationPeriodRequest>({
    name: '',
    semester: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    description: '',
    rubricId: undefined,
    targetClasses: '',
    isActive: true,
  });

  useEffect(() => {
    // Check if user is ADMIN or INSTITUTE_COUNCIL
    if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('INSTITUTE_COUNCIL'))) {
      router.push('/dashboard');
      return;
    }

    loadPeriods();
    loadRubrics();
  }, [user, router]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const response = await getAllEvaluationPeriods();
      if (response.success && response.data) {
        setPeriods(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách đợt đánh giá",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRubrics = async () => {
    try {
      const response = await getAllRubrics();
      if (response.success && response.data) {
        setRubrics(response.data);
      }
    } catch (error) {
      // Failed to load rubrics
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      semester: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      description: '',
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (period: EvaluationPeriod) => {
    setSelectedPeriod(period);
    setFormData({
      name: period.name,
      semester: period.semester,
      academicYear: period.academicYear,
      startDate: parseDate(period.startDate as any), // Parse date (can be string or array)
      endDate: parseDate(period.endDate as any),
      description: period.description || '',
      rubricId: period.rubricId,
      targetClasses: period.targetClasses || '',
      isActive: period.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (period: EvaluationPeriod) => {
    setSelectedPeriod(period);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.name || !formData.semester || !formData.academicYear || !formData.startDate || !formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await createEvaluationPeriod(formData);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã tạo đợt đánh giá thành công",
        });
        setIsCreateDialogOpen(false);
        loadPeriods();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đợt đánh giá",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedPeriod) return;

    if (!formData.name || !formData.semester || !formData.academicYear || !formData.startDate || !formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const updateRequest: UpdateEvaluationPeriodRequest = {
        name: formData.name,
        semester: formData.semester,
        academicYear: formData.academicYear,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        rubricId: formData.rubricId,
        targetClasses: formData.targetClasses,
        isActive: formData.isActive || false,
      };
      const response = await updateEvaluationPeriod(selectedPeriod.id, updateRequest);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật đợt đánh giá thành công",
        });
        setIsEditDialogOpen(false);
        loadPeriods();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật đợt đánh giá",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPeriod) return;

    setSubmitting(true);
    try {
      const response = await deactivateEvaluationPeriod(selectedPeriod.id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã vô hiệu hóa đợt đánh giá thành công",
        });
        setIsDeleteDialogOpen(false);
        loadPeriods();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể vô hiệu hóa đợt đánh giá",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to parse date from backend (can be string or array)
  const parseDate = (date: string | number[] | undefined): string => {
    if (!date) return '';
    
    // If it's already a string (ISO format)
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    
    // If it's an array from LocalDate [year, month, day]
    if (Array.isArray(date) && date.length >= 3) {
      const year = date[0];
      const month = String(date[1]).padStart(2, '0');
      const day = String(date[2]).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

  const formatDate = (date: string | number[] | undefined) => {
    if (!date) return 'N/A';
    
    let dateObj: Date;
    
    // If it's already a string (ISO format)
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // If it's an array from LocalDate [year, month, day]
    else if (Array.isArray(date) && date.length >= 3) {
      dateObj = new Date(date[0], date[1] - 1, date[2]); // month is 0-indexed in JS Date
    } else {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Quản lý Đợt Đánh giá</h1>
              <p className="text-muted-foreground">
                Tạo và quản lý các đợt đánh giá điểm rèn luyện
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo Đợt Mới
            </Button>
          </div>

          {periods.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có đợt đánh giá nào</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo Đợt Đầu Tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {periods.map((period) => (
                <Card key={period.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{period.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(period)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(period)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {period.semester} - {period.academicYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bắt đầu:</span>
                      <span>{formatDate(period.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kết thúc:</span>
                      <span>{formatDate(period.endDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <div className="flex gap-2">
                        {period.isOpen && (
                          <Badge variant="default">Đang mở</Badge>
                        )}
                        {period.isFuture && (
                          <Badge variant="secondary">Sắp tới</Badge>
                        )}
                        {period.isEnded && (
                          <Badge variant="outline">Đã kết thúc</Badge>
                        )}
                        {!period.isActive && (
                          <Badge variant="destructive">Đã vô hiệu hóa</Badge>
                        )}
                      </div>
                    </div>
                    {period.description && (
                      <p className="text-sm text-muted-foreground mt-2">{period.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Đợt Đánh giá Mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin để tạo đợt đánh giá mới
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên đợt đánh giá *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Đợt 1 - Học kỳ 1 năm học 2024-2025"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="semester">Học kỳ *</Label>
                    <Input
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="Ví dụ: 2024-2025-HK1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Năm học *</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="Ví dụ: 2024-2025"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả về đợt đánh giá này..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubricId">Rubric *</Label>
                  <select
                    id="rubricId"
                    value={formData.rubricId || ''}
                    onChange={(e) => setFormData({ ...formData, rubricId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">-- Chọn rubric --</option>
                    {rubrics.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Lớp áp dụng</Label>
                  <RubricTargetSelector
                    value={formData.targetClasses || ''}
                    onChange={(v) => setFormData({ ...formData, targetClasses: v })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Kích hoạt đợt đánh giá ngay sau khi tạo
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSubmitCreate} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Đợt'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Chỉnh sửa Đợt Đánh giá</DialogTitle>
                <DialogDescription>
                  Cập nhật thông tin đợt đánh giá
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tên đợt đánh giá *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-semester">Học kỳ *</Label>
                    <Input
                      id="edit-semester"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-academicYear">Năm học *</Label>
                    <Input
                      id="edit-academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Ngày bắt đầu *</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">Ngày kết thúc *</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Mô tả</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rubricId">Rubric *</Label>
                  <select
                    id="edit-rubricId"
                    value={formData.rubricId || ''}
                    onChange={(e) => setFormData({ ...formData, rubricId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">-- Chọn rubric --</option>
                    {rubrics.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Lớp áp dụng</Label>
                  <RubricTargetSelector
                    value={formData.targetClasses || ''}
                    onChange={(v) => setFormData({ ...formData, targetClasses: v })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-isActive" className="cursor-pointer">
                    Kích hoạt đợt đánh giá
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSubmitEdit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận vô hiệu hóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn vô hiệu hóa đợt đánh giá "{selectedPeriod?.name}"? 
                  Sinh viên sẽ không thể nộp đánh giá trong đợt này nữa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Vô hiệu hóa'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

