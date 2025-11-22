"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllRubrics, 
  createRubric, 
  updateRubric, 
  activateRubric, 
  deactivateRubric,
  getCriteriaByRubric,
  createCriteria,
  updateCriteria,
  deleteCriteria
} from '@/lib/evaluation';
import type { Rubric, Criteria } from '@/types/evaluation';
import { Loader2 } from 'lucide-react';
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
import { parseSubCriteria } from '@/lib/criteria-parser';
import { RubricList } from './components/RubricList';
import { RubricEditor } from './components/RubricEditor';
import type { SubCriteriaFormData, CriteriaFormData, RubricFormData } from './types';

export default function SystemConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<CriteriaFormData[]>([]);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [rubricFormData, setRubricFormData] = useState<RubricFormData>({
    id: undefined,
    name: '',
    description: '',
    maxScore: 100,
    academicYear: '',
    isActive: true,
    targetClasses: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rubricToDelete, setRubricToDelete] = useState<Rubric | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<number[]>([]);

  useEffect(() => {
    loadRubrics();
  }, []);

  const loadRubrics = async () => {
    try {
      setLoading(true);
      const response = await getAllRubrics();
      if (response.success && response.data) {
        setRubrics(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách rubric",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCriteria = async (rubricId: number) => {
    try {
      const response = await getCriteriaByRubric(rubricId);
      if (response.success && response.data) {
        const criteriaData: CriteriaFormData[] = response.data
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(c => {
            // Parse sub-criteria from description
            const subCriteria = parseSubCriteria(c.orderIndex, c.description || '');
            const subCriteriaData: SubCriteriaFormData[] = subCriteria.map(sub => ({
              id: sub.id,
              name: sub.name,
              points: sub.maxPoints,
              description: sub.description,
            }));
            const subPointsTotal = subCriteriaData
              .filter(sub => !sub.isDeleted)
              .reduce((sum, sub) => sum + (sub.points || 0), 0);
            
            return {
              id: c.id,
              name: c.name,
              description: c.description || '',
              maxPoints: subCriteriaData.length > 0 ? subPointsTotal : c.maxPoints,
              orderIndex: c.orderIndex,
              subCriteria: subCriteriaData,
            };
          });
        setCriteria(criteriaData);
        setExpandedCriteria(criteriaData.map((_, idx) => idx));
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách tiêu chí",
        variant: "destructive",
      });
    }
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setSelectedRubric(null);
    setRubricFormData({
      id: undefined,
      name: '',
      description: 'Bảng tiêu chí đánh giá điểm rèn luyện năm học 2024-2025 - Học viện CN Bưu chính Viễn thông (PTIT).',
      maxScore: 100,
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      isActive: true,
      targetClasses: '',
    });
    setCriteria([]);
    setExpandedCriteria([]);
  };

  const handleEditRubric = async (rubric: Rubric) => {
    setIsEditing(true);
    setSelectedRubric(rubric);
    setRubricFormData({
      id: rubric.id,
      name: rubric.name,
      description: rubric.description || '',
      maxScore: rubric.maxScore,
      academicYear: rubric.academicYear || '',
      isActive: rubric.isActive,
      targetClasses: rubric.targetClasses || '',
    });
    await loadCriteria(rubric.id);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRubric(null);
    setRubricFormData({
      id: undefined,
      name: '',
      description: '',
      maxScore: 100,
      academicYear: '',
      isActive: true,
      targetClasses: '',
    });
    setCriteria([]);
  };

  const handleAddCriteria = () => {
    const newOrderIndex = criteria.length > 0 
      ? Math.max(...criteria.map(c => c.orderIndex)) + 1 
      : 1;
    
    setCriteria([
      ...criteria,
      {
        name: '',
        description: '',
        maxPoints: 0,
        orderIndex: newOrderIndex,
        isNew: true,
        subCriteria: [],
      }
    ]);
    setExpandedCriteria(prev => [...prev, criteria.length]);
  };

  const calculateSubPoints = (subCriteria?: SubCriteriaFormData[]) => {
    return (subCriteria || [])
      .filter(sub => !sub.isDeleted)
      .reduce((sum, sub) => sum + (sub.points || 0), 0);
  };

  const handleAddSubCriteria = (criteriaIndex: number) => {
    const criterion = criteria[criteriaIndex];
    if (!criterion.subCriteria) {
      criterion.subCriteria = [];
    }
    
    const activeSubCriteria = criterion.subCriteria.filter(s => !s.isDeleted);
    const newSubId = `${criterion.orderIndex}.${activeSubCriteria.length + 1}`;
    
    const updated = [...criteria];
    const updatedSubCriteria = [
      ...(updated[criteriaIndex].subCriteria || []),
      {
        id: newSubId,
        name: '',
        points: 0,
        description: '',
        isNew: true,
      }
    ];
    updated[criteriaIndex] = {
      ...updated[criteriaIndex],
      subCriteria: updatedSubCriteria,
      maxPoints: calculateSubPoints(updatedSubCriteria),
    };
    setCriteria(updated);
    setExpandedCriteria(prev => prev.includes(criteriaIndex) ? prev : [...prev, criteriaIndex]);
  };

  const handleUpdateSubCriteria = (
    criteriaIndex: number,
    subIndex: number,
    field: keyof SubCriteriaFormData,
    value: any
  ) => {
    const updated = [...criteria];
    const subCriteria = [...(updated[criteriaIndex].subCriteria || [])];
    subCriteria[subIndex] = { ...subCriteria[subIndex], [field]: value };
    updated[criteriaIndex] = { 
      ...updated[criteriaIndex], 
      subCriteria,
      maxPoints: calculateSubPoints(subCriteria),
    };
    setCriteria(updated);
    setExpandedCriteria(prev => prev.includes(criteriaIndex) ? prev : [...prev, criteriaIndex]);
  };

  const handleDeleteSubCriteria = (criteriaIndex: number, subIndex: number) => {
    const updated = [...criteria];
    const subCriteria = [...(updated[criteriaIndex].subCriteria || [])];
    const sub = subCriteria[subIndex];
    
    if (sub.id && !sub.isNew) {
      // Mark as deleted if it's an existing sub-criteria
      subCriteria[subIndex] = { ...sub, isDeleted: true };
    } else {
      // Remove if it's new
      subCriteria.splice(subIndex, 1);
    }
    
    updated[criteriaIndex] = { 
      ...updated[criteriaIndex], 
      subCriteria,
      maxPoints: calculateSubPoints(subCriteria),
    };
    setCriteria(updated);
    setExpandedCriteria(prev => prev.includes(criteriaIndex) ? prev : [...prev, criteriaIndex]);
  };

  const toggleCriteriaExpansion = (index: number) => {
    setExpandedCriteria(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatDescriptionWithSubCriteria = (criterion: CriteriaFormData): string => {
    const activeSubCriteria = (criterion.subCriteria || []).filter(s => !s.isDeleted);
    if (activeSubCriteria.length === 0) {
      return '';
    }
    
    // Update sub-criteria IDs based on order
    activeSubCriteria.forEach((sub, idx) => {
      sub.id = `${criterion.orderIndex}.${idx + 1}`;
    });
    
    const subCriteriaLines = activeSubCriteria.map(sub => {
      const desc = sub.description ? ` (${sub.description})` : '';
      const pointsText = sub.points < 0 ? `${sub.points} điểm` : `${sub.points} điểm`;
      return `${sub.id}. ${sub.name}: ${pointsText}${desc}`;
    });
    
    return `Bao gồm:\n${subCriteriaLines.join('\n')}`;
  };

  const handleUpdateCriteria = (index: number, field: keyof CriteriaFormData, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleDeleteCriteria = (index: number) => {
    const criterion = criteria[index];
    if (criterion.id) {
      const updated = [...criteria];
      updated[index] = { ...updated[index], isDeleted: true };
      setCriteria(updated);
    } else {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
    setExpandedCriteria(prev =>
      prev
        .filter(i => i !== index)
        .map(i => (i > index ? i - 1 : i))
    );
  };

  const handleMoveCriteria = (index: number, direction: 'up' | 'down') => {
    const updated = [...criteria];
    if (direction === 'up' && index > 0) {
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      updated[index - 1].orderIndex = index;
      updated[index].orderIndex = index + 1;
    } else if (direction === 'down' && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      updated[index].orderIndex = index + 1;
      updated[index + 1].orderIndex = index + 2;
    }
    setCriteria(updated);
  };

  const calculateTotalPoints = () => {
    return criteria
      .filter(c => !c.isDeleted)
      .reduce((sum, c) => sum + (c.maxPoints || 0), 0);
  };

  const handleSave = async () => {
    if (!rubricFormData.name || !rubricFormData.academicYear) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin rubric",
        variant: "destructive",
      });
      return;
    }

    const activeCriteria = criteria.filter(c => !c.isDeleted);
    if (activeCriteria.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một tiêu chí",
        variant: "destructive",
      });
      return;
    }

    const totalPoints = calculateTotalPoints();
    if (Math.abs(totalPoints - rubricFormData.maxScore) > 0.01) {
      toast({
        title: "Cảnh báo",
        description: `Tổng điểm các tiêu chí (${totalPoints}) không khớp với điểm tối đa của rubric (${rubricFormData.maxScore}). Bạn có muốn tiếp tục?`,
        variant: "destructive",
      });
      // Vẫn cho phép lưu, nhưng cảnh báo
    }

    try {
      setSubmitting(true);
      
      // Save or update rubric
      let rubricId: number;
      const rubricData = {
        ...rubricFormData,
        targetClasses: rubricFormData.targetClasses.trim() || undefined
      };
      
      console.log('🔍 DEBUG - Rubric Form Data:', rubricFormData);
      console.log('🔍 DEBUG - Rubric Data to send:', rubricData);
      console.log('🔍 DEBUG - isActive value:', rubricData.isActive);
      console.log('🔍 DEBUG - targetClasses value:', rubricData.targetClasses);
      
      if (selectedRubric) {
        console.log('🔄 DEBUG - Updating rubric ID:', selectedRubric.id);
        const response = await updateRubric(selectedRubric.id, rubricData);
        console.log('✅ DEBUG - Update response:', response);
        if (!response.success) throw new Error(response.message);
        rubricId = selectedRubric.id;
      } else {
        console.log('➕ DEBUG - Creating new rubric');
        const response = await createRubric(rubricData);
        console.log('✅ DEBUG - Create response:', response);
        if (!response.success) throw new Error(response.message);
        rubricId = response.data.id;
      }

      // Save criteria
      const activeCriteria = criteria.filter(c => !c.isDeleted);
      
      // Delete criteria that were marked as deleted
      for (const criterion of criteria) {
        if (criterion.isDeleted && criterion.id) {
          try {
            await deleteCriteria(criterion.id);
          } catch (error) {
            console.error('Error deleting criterion:', error);
          }
        }
      }

      // Update existing criteria and create new ones
      for (let i = 0; i < activeCriteria.length; i++) {
        const criterion = activeCriteria[i];
        criterion.orderIndex = i + 1;
        
        // Format description with sub-criteria
        const formattedDescription = formatDescriptionWithSubCriteria(criterion);
        
        if (criterion.id) {
          // Update existing
          await updateCriteria(criterion.id, {
            name: criterion.name,
            description: formattedDescription,
            maxPoints: criterion.maxPoints,
            orderIndex: criterion.orderIndex,
          });
        } else {
          // Create new
          await createCriteria({
            name: criterion.name,
            description: formattedDescription,
            maxPoints: criterion.maxPoints,
            orderIndex: criterion.orderIndex,
            rubricId: rubricId,
          });
        }
      }

      toast({
        title: "Thành công",
        description: selectedRubric ? "Đã cập nhật rubric và tiêu chí" : "Đã tạo rubric và tiêu chí mới",
      });

      await loadRubrics();
      handleCancelEdit();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu rubric",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRubric = async () => {
    if (!rubricToDelete) return;

    try {
      await deactivateRubric(rubricToDelete.id);
      toast({
        title: "Thành công",
        description: "Đã vô hiệu hóa rubric",
      });
      setIsDeleteDialogOpen(false);
      setRubricToDelete(null);
      await loadRubrics();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể vô hiệu hóa rubric",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Cấu hình Hệ thống</h1>
            <p className="text-muted-foreground">
              Quản lý rubric và tiêu chí đánh giá
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Rubrics List */}
            <div className="lg:col-span-1">
              <RubricList
                rubrics={rubrics}
                selectedRubric={selectedRubric}
                onSelectRubric={handleEditRubric}
                onCreateNew={handleCreateNew}
                onDeleteRubric={(rubric) => {
                  setRubricToDelete(rubric);
                  setIsDeleteDialogOpen(true);
                }}
              />
            </div>

            {/* Right: Editor */}
            <div className="lg:col-span-2">
              <RubricEditor
                isEditing={isEditing}
                selectedRubric={selectedRubric}
                rubricFormData={rubricFormData}
                setRubricFormData={setRubricFormData}
                criteria={criteria}
                expandedCriteria={expandedCriteria}
                submitting={submitting}
                onCreateNew={handleCreateNew}
                onCancelEdit={handleCancelEdit}
                onSave={handleSave}
                onAddCriteria={handleAddCriteria}
                handleUpdateCriteria={handleUpdateCriteria}
                handleDeleteCriteria={handleDeleteCriteria}
                handleMoveCriteria={handleMoveCriteria}
                handleAddSubCriteria={handleAddSubCriteria}
                handleUpdateSubCriteria={handleUpdateSubCriteria}
                handleDeleteSubCriteria={handleDeleteSubCriteria}
                toggleCriteriaExpansion={toggleCriteriaExpansion}
                calculateSubPoints={calculateSubPoints}
                calculateTotalPoints={calculateTotalPoints}
              />
            </div>
          </div>

          {/* Delete Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận vô hiệu hóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn vô hiệu hóa rubric "{rubricToDelete?.name}"? 
                  Rubric sẽ không còn active nhưng vẫn được lưu trong hệ thống.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRubricToDelete(null)}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRubric}>
                  Vô hiệu hóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}