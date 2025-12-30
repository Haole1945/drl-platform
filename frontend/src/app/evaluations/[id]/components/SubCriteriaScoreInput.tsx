"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare } from 'lucide-react';
import type { SubCriteria, ScoreAdjustment } from '@/types/evaluation';

interface SubCriteriaScoreInputProps {
  subCriteria: SubCriteria;
  criterionId: number;
  score: number;
  isAdjusted: boolean;
  hasNote: boolean;
  adjustmentNote?: ScoreAdjustment;
  onScoreChange: (value: number) => void;
  onOpenNoteDialog: () => void;
  disabled?: boolean;
}

export function SubCriteriaScoreInput({
  subCriteria,
  criterionId,
  score,
  isAdjusted,
  hasNote,
  adjustmentNote,
  onScoreChange,
  onOpenNoteDialog,
  disabled = false,
}: SubCriteriaScoreInputProps) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={score}
        onChange={(e) => onScoreChange(parseFloat(e.target.value) || 0)}
        className="w-20"
        min={0}
        max={subCriteria.maxPoints}
        step={0.5}
        disabled={disabled}
      />
      
      {isAdjusted && (
        <>
          {hasNote ? (
            // Có ghi chú - hiển thị popover
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  type="button"
                >
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Ghi chú chỉnh sửa</h4>
                  <div className="text-xs space-y-1">
                    <p className="flex items-center gap-1">
                      <strong>Điểm gốc:</strong> {adjustmentNote?.originalScore}
                      <span className="text-muted-foreground">→</span>
                      <strong>Điểm mới:</strong> {adjustmentNote?.newScore}
                    </p>
                    {adjustmentNote?.reason && (
                      <div>
                        <strong>Lý do:</strong>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {adjustmentNote.reason}
                        </p>
                      </div>
                    )}
                    {adjustmentNote?.evidence && (
                      <div>
                        <strong>Minh chứng:</strong>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {adjustmentNote.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onOpenNoteDialog}
                    type="button"
                  >
                    Chỉnh sửa ghi chú
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            // Chưa có ghi chú - hiển thị button để thêm
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onOpenNoteDialog}
              title="Thêm ghi chú chỉnh sửa"
              type="button"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground hover:text-blue-500" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
