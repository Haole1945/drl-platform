/**
 * Grade Badge Component
 * Hiển thị xếp loại điểm rèn luyện
 */

import { getGrade } from '@/lib/grading';

interface GradeBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function GradeBadge({ score, className = '' }: GradeBadgeProps) {
  const grade = getGrade(score);

  if (!grade) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground font-semibold leading-none">Xếp loại:</span>
      <span
        className={`px-2.5 py-1 rounded-full text-sm font-medium leading-none ${grade.color} ${grade.bgColor}`}
      >
        {grade.label}
      </span>
    </span>
  );
}

/**
 * Inline grade display (for compact spaces)
 */
export function InlineGrade({ score }: { score: number | null | undefined }) {
  const grade = getGrade(score);

  if (!grade) {
    return null;
  }

  return (
    <span className={`text-sm text-muted-foreground`}>
      Xếp loại: <span className={`font-semibold ${grade.color}`}>{grade.label}</span>
    </span>
  );
}
