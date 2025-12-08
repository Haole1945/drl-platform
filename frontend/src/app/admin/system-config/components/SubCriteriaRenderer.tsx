import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import type { SubCriteriaFormData, CriteriaFormData } from '../types';

interface SubCriteriaRendererProps {
  activeSubCriteria: SubCriteriaFormData[];
  actualIndex: number;
  criterion: CriteriaFormData;
  handleUpdateSubCriteria: (criteriaIndex: number, subIndex: number, field: keyof SubCriteriaFormData, value: any) => void;
  handleDeleteSubCriteria: (criteriaIndex: number, subIndex: number) => void;
}

export const SubCriteriaRenderer: React.FC<SubCriteriaRendererProps> = ({
  activeSubCriteria,
  actualIndex,
  criterion,
  handleUpdateSubCriteria,
  handleDeleteSubCriteria
}) => {
  if (activeSubCriteria.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Chưa có tiêu chí phụ nào. Nhấn "Thêm tiêu chí phụ" để bắt đầu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeSubCriteria.map((sub, subIndex) => {
        const actualSubIndex = (criterion.subCriteria || []).findIndex(s => s === sub);
        return (
          <div
            key={`sub-${actualIndex}-${actualSubIndex}`}
            className="rounded-lg border bg-background p-3 space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-2 flex flex-col">
                <Label className="text-xs text-muted-foreground">Mã</Label>
                <Input value={sub.id || ''} readOnly className="h-9 text-center bg-muted" />
              </div>
              <div className="md:col-span-6 flex flex-col">
                <Label className="text-xs text-muted-foreground">Tên tiêu chí phụ *</Label>
                <Input
                  placeholder="Ví dụ: 1.1. Ý thức học tập"
                  value={sub.name || ''}
                  onChange={(e) => handleUpdateSubCriteria(actualIndex, actualSubIndex, 'name', e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <Label className="text-xs text-muted-foreground">Điểm *</Label>
                <Input
                  type="number"
                  value={sub.points ?? 0}
                  onChange={(e) => handleUpdateSubCriteria(actualIndex, actualSubIndex, 'points', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                />
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-destructive"
                  onClick={() => handleDeleteSubCriteria(actualIndex, actualSubIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mô tả tiêu chí phụ</Label>
              <Textarea
                placeholder="Mô tả chi tiết, điều kiện, hướng dẫn chấm điểm..."
                value={sub.description || ''}
                onChange={(e) => handleUpdateSubCriteria(actualIndex, actualSubIndex, 'description', e.target.value)}
                className="min-h-[70px] text-sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};