/**
 * Training Point Grading System
 * Hệ thống xếp loại điểm rèn luyện
 */

export type GradeLevel = 
  | 'EXCELLENT'    // Xuất sắc
  | 'GOOD'         // Giỏi
  | 'FAIRLY_GOOD'  // Khá
  | 'AVERAGE'      // Trung bình
  | 'WEAK'         // Yếu
  | 'POOR';        // Kém

export interface Grade {
  level: GradeLevel;
  label: string;
  color: string;
  bgColor: string;
  minScore: number;
  maxScore: number;
}

/**
 * Grading scale based on training point score
 * Thang điểm xếp loại
 */
export const GRADE_SCALE: Grade[] = [
  {
    level: 'EXCELLENT',
    label: 'Xuất sắc',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    minScore: 90,
    maxScore: 100,
  },
  {
    level: 'GOOD',
    label: 'Giỏi',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    minScore: 80,
    maxScore: 89,
  },
  {
    level: 'FAIRLY_GOOD',
    label: 'Khá',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    minScore: 65,
    maxScore: 79,
  },
  {
    level: 'AVERAGE',
    label: 'Trung bình',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    minScore: 50,
    maxScore: 64,
  },
  {
    level: 'WEAK',
    label: 'Yếu',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    minScore: 35,
    maxScore: 49,
  },
  {
    level: 'POOR',
    label: 'Kém',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    minScore: 0,
    maxScore: 34,
  },
];

/**
 * Get grade based on score
 * @param score - Training point score (0-100)
 * @returns Grade object or null if score is invalid
 */
export function getGrade(score: number | null | undefined): Grade | null {
  if (score === null || score === undefined || score < 0) {
    return null;
  }

  // Find matching grade
  for (const grade of GRADE_SCALE) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade;
    }
  }

  // Fallback for scores > 100 (shouldn't happen, but just in case)
  if (score > 100) {
    return GRADE_SCALE[0]; // Xuất sắc
  }

  return null;
}

/**
 * Get grade label for display
 * @param score - Training point score
 * @returns Grade label string or empty string
 */
export function getGradeLabel(score: number | null | undefined): string {
  const grade = getGrade(score);
  return grade ? grade.label : '';
}

/**
 * Get grade color classes
 * @param score - Training point score
 * @returns Object with color and bgColor classes
 */
export function getGradeColors(score: number | null | undefined): {
  color: string;
  bgColor: string;
} {
  const grade = getGrade(score);
  return grade
    ? { color: grade.color, bgColor: grade.bgColor }
    : { color: 'text-gray-600', bgColor: 'bg-gray-100' };
}
