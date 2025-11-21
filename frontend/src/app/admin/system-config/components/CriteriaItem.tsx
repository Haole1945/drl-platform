import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { SubCriteriaRenderer } from './SubCriteriaRenderer';
import type { SubCriteriaFormData, CriteriaFormData } from '../types';

interface CriteriaItemProps {
  criterion: CriteriaFormData;
  actualIndex: number;
  displayIndex: number;
  totalCriteria: number;
  expandedCriteria: number[];
  handleUpdateCriteria: (index: number, field: keyof CriteriaFormData, value: any) => void;
  handleDeleteCriteria: (index: number) => void;
  handleMoveCriteria: (index: number, direction: 'up' | 'down') => void;
  handleAddSubCriteria: (criteriaIndex: number) => void;
  handleUpdateSubCriteria: (criteriaIndex: number, subIndex: number, field: keyof SubCriteriaFormData, value: any) => void;
  handleDeleteSubCriteria: (criteriaIndex: number, subIndex: number) => void;
  toggleCriteriaExpansion: (index: number) => void;
  calculateSubPoints: (subCriteria?: SubCriteriaFormData[]) => number;
}

export const CriteriaItem: React.FC<CriteriaItemProps> = ({
  criterion,
  actualIndex,
  displayIndex,
  totalCriteria,
  expandedCriteria,
  handleUpdateCriteria,
  handleDeleteCriteria,
  handleMoveCriteria,
  handleAddSubCriteria,
  handleUpdateSubCriteria,
  handleDeleteSubCriteria,
  toggleCriteriaExpansion,
  calculateSubPoints
}) => {
  const activeSubCriteria = (criterion.subCriteria || []).filter(s => !s.isDeleted);

  return (
    <div className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/5 via-background to-background p-5 space-y-5 shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 flex-1">
          <Badge
            variant="secondary"
            className="uppercase tracking-wide text-[0.7rem] w-fit px-3 py-1 bg-primary/10 text-primary border border-primary/30"
          >
            Tiêu chí {criterion.orderIndex}
          </Badge>
          <div className="flex flex-col gap-3">
            <div className="flex-1">
              <Textarea
                placeholder="Tên/Mô tả ngắn của tiêu chí *"
                value={criterion.name}
                onChange={(e) => handleUpdateCriteria(actualIndex, 'name', e.target.value)}
                className="min-h-[72px] text-base font-semibold resize-none"
              />
            </div>

          </div>
        </div>
        
        <div className="flex flex-col gap-3 items-end min-w-[220px]">
          <div className="flex flex-wrap gap-2 justify-end w-full">
            <Button
              variant="outline"
              size="sm"
              className="h-9 min-w-[170px] justify-center"
              onClick={() => handleAddSubCriteria(actualIndex)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm tiêu chí phụ
            </Button>
            {displayIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9"
                onClick={() => handleMoveCriteria(actualIndex, 'up')}
                title="Di chuyển lên"
              >
                ↑
              </Button>
            )}
            {displayIndex < totalCriteria - 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9"
                onClick={() => handleMoveCriteria(actualIndex, 'down')}
                title="Di chuyển xuống"
              >
                ↓
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 text-destructive"
              onClick={() => handleDeleteCriteria(actualIndex)}
              title="Xóa tiêu chí"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full max-w-[220px]">
            <Label className="text-xs text-muted-foreground block text-right">Điểm tổng</Label>
            <Input
              type="number"
              value={criterion.maxPoints}
              onChange={(e) => handleUpdateCriteria(actualIndex, 'maxPoints', parseFloat(e.target.value) || 0)}
              className="h-12 text-center bg-primary/10 text-primary font-semibold tracking-wide"
            />
          </div>
        </div>
      </div>



      {/* Sub-criteria section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Tiêu chí phụ</h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs uppercase tracking-wide text-muted-foreground"
            onClick={() => toggleCriteriaExpansion(actualIndex)}
          >
            {expandedCriteria.includes(actualIndex) ? (
              <>
                Thu gọn <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Mở rộng <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        
        {expandedCriteria.includes(actualIndex) && (
          <SubCriteriaRenderer
            activeSubCriteria={activeSubCriteria}
            actualIndex={actualIndex}
            criterion={criterion}
            handleUpdateSubCriteria={handleUpdateSubCriteria}
            handleDeleteSubCriteria={handleDeleteSubCriteria}
          />
        )}
      </div>


    </div>
  );
};