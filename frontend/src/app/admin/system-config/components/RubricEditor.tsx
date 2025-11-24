import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Save } from 'lucide-react';
import { CriteriaItem } from './CriteriaItem';
import type { Rubric } from '@/types/evaluation';
import type { SubCriteriaFormData, CriteriaFormData, RubricFormData } from '../types';

interface RubricEditorProps {
  isEditing: boolean;
  selectedRubric: Rubric | null;
  rubricFormData: RubricFormData;
  setRubricFormData: (data: RubricFormData) => void;
  criteria: CriteriaFormData[];
  expandedCriteria: number[];
  submitting: boolean;
  onCreateNew: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onAddCriteria: () => void;
  handleUpdateCriteria: (index: number, field: keyof CriteriaFormData, value: any) => void;
  handleDeleteCriteria: (index: number) => void;
  handleMoveCriteria: (index: number, direction: 'up' | 'down') => void;
  handleAddSubCriteria: (criteriaIndex: number) => void;
  handleUpdateSubCriteria: (criteriaIndex: number, subIndex: number, field: keyof SubCriteriaFormData, value: any) => void;
  handleDeleteSubCriteria: (criteriaIndex: number, subIndex: number) => void;
  toggleCriteriaExpansion: (index: number) => void;
  calculateSubPoints: (subCriteria?: SubCriteriaFormData[]) => number;
  calculateTotalPoints: () => number;
}

export const RubricEditor: React.FC<RubricEditorProps> = ({
  isEditing,
  selectedRubric,
  rubricFormData,
  setRubricFormData,
  criteria,
  expandedCriteria,
  submitting,
  onCreateNew,
  onCancelEdit,
  onSave,
  onAddCriteria,
  handleUpdateCriteria,
  handleDeleteCriteria,
  handleMoveCriteria,
  handleAddSubCriteria,
  handleUpdateSubCriteria,
  handleDeleteSubCriteria,
  toggleCriteriaExpansion,
  calculateSubPoints,
  calculateTotalPoints
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing 
            ? (selectedRubric ? 'Chỉnh sửa Rubric' : 'Tạo Rubric Mới')
            : 'Chi tiết Rubric'
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            {/* Rubric Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="rubric-name">Tên Rubric *</Label>
                <Input
                  id="rubric-name"
                  value={rubricFormData.name}
                  onChange={(e) => setRubricFormData({ ...rubricFormData, name: e.target.value })}
                  placeholder="Ví dụ: Rubric Đánh giá Điểm Rèn Luyện 2024-2025"
                />
              </div>
              <div>
                <Label htmlFor="rubric-description">Mô tả</Label>
                <Textarea
                  id="rubric-description"
                  value={rubricFormData.description}
                  onChange={(e) => setRubricFormData({ ...rubricFormData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về rubric này..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rubric-max-score">Điểm tối đa *</Label>
                  <Input
                    id="rubric-max-score"
                    type="number"
                    value={rubricFormData.maxScore}
                    onChange={(e) => setRubricFormData({ ...rubricFormData, maxScore: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="rubric-academic-year">Năm học *</Label>
                  <Input
                    id="rubric-academic-year"
                    value={rubricFormData.academicYear}
                    onChange={(e) => setRubricFormData({ ...rubricFormData, academicYear: e.target.value })}
                    placeholder="2024-2025"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <Label htmlFor="rubric-active" className="text-base font-medium">Kích hoạt Rubric</Label>
                    <p className="text-sm text-muted-foreground">
                      Rubric này sẽ được sử dụng cho đánh giá
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="rubric-active"
                      checked={rubricFormData.isActive}
                      onChange={(e) => {
                        console.log('🔘 Toggle changed - New value:', e.target.checked);
                        console.log('🔘 Current rubricFormData.isActive:', rubricFormData.isActive);
                        setRubricFormData({ ...rubricFormData, isActive: e.target.checked });
                        console.log('🔘 After setState - should be:', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Criteria List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tiêu chí Đánh giá</h3>
                  <p className="text-sm text-muted-foreground">
                    Tổng điểm: <strong>{calculateTotalPoints()}</strong> / {rubricFormData.maxScore} điểm
                    {Math.abs(calculateTotalPoints() - rubricFormData.maxScore) > 0.01 && (
                      <span className="text-destructive ml-2">
                        (Chưa khớp!)
                      </span>
                    )}
                  </p>
                </div>
                <Button onClick={onAddCriteria} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Tiêu chí
                </Button>
              </div>

              <div className="space-y-4">
                {criteria
                  .filter(c => !c.isDeleted)
                  .map((criterion, index) => {
                    const actualIndex = criteria.findIndex(c => c === criterion);
                    const activeCriteria = criteria.filter(c => !c.isDeleted);
                    return (
                      <CriteriaItem
                        key={criterion.id || actualIndex}
                        criterion={criterion}
                        actualIndex={actualIndex}
                        displayIndex={index}
                        totalCriteria={activeCriteria.length}
                        expandedCriteria={expandedCriteria}
                        handleUpdateCriteria={handleUpdateCriteria}
                        handleDeleteCriteria={handleDeleteCriteria}
                        handleMoveCriteria={handleMoveCriteria}
                        handleAddSubCriteria={handleAddSubCriteria}
                        handleUpdateSubCriteria={handleUpdateSubCriteria}
                        handleDeleteSubCriteria={handleDeleteSubCriteria}
                        toggleCriteriaExpansion={toggleCriteriaExpansion}
                        calculateSubPoints={calculateSubPoints}
                      />
                    );
                  })}
                {criteria.filter(c => !c.isDeleted).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg">
                    Chưa có tiêu chí nào. Hãy thêm tiêu chí mới.
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancelEdit}>
                Hủy
              </Button>
              <Button onClick={onSave} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chọn một rubric từ danh sách bên trái để chỉnh sửa</p>
            <p className="mt-2">hoặc</p>
            <Button onClick={onCreateNew} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Tạo Rubric Mới
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};