import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { Rubric } from '@/types/evaluation';

interface RubricListProps {
  rubrics: Rubric[];
  selectedRubric: Rubric | null;
  onSelectRubric: (rubric: Rubric) => void;
  onCreateNew: () => void;
  onDeleteRubric?: (rubric: Rubric) => void;
}

export const RubricList: React.FC<RubricListProps> = ({
  rubrics,
  selectedRubric,
  onSelectRubric,
  onCreateNew,
  onDeleteRubric
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách Rubrics</CardTitle>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Chọn rubric để chỉnh sửa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rubrics.map((rubric) => (
          <Card
            key={rubric.id}
            className={`cursor-pointer transition-colors ${
              selectedRubric?.id === rubric.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelectRubric(rubric)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{rubric.name}</h4>
                    {rubric.isActive && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rubric.academicYear} - {rubric.maxScore} điểm
                  </p>
                </div>
                {onDeleteRubric && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRubric(rubric);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {rubrics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có rubric nào</p>
            <Button onClick={onCreateNew} className="mt-2" size="sm">
              Tạo rubric đầu tiên
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};