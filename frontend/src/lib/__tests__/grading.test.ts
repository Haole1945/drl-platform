/**
 * Unit tests for grading system
 * Run with: npm test grading.test.ts
 */

import { getGrade, getGradeLabel, getGradeColors, GRADE_SCALE } from '../grading';

describe('Grading System', () => {
  describe('getGrade', () => {
    it('should return Xuất sắc for scores 90-100', () => {
      expect(getGrade(90)?.label).toBe('Xuất sắc');
      expect(getGrade(95)?.label).toBe('Xuất sắc');
      expect(getGrade(100)?.label).toBe('Xuất sắc');
    });

    it('should return Giỏi for scores 80-89', () => {
      expect(getGrade(80)?.label).toBe('Giỏi');
      expect(getGrade(85)?.label).toBe('Giỏi');
      expect(getGrade(89)?.label).toBe('Giỏi');
    });

    it('should return Khá for scores 65-79', () => {
      expect(getGrade(65)?.label).toBe('Khá');
      expect(getGrade(70)?.label).toBe('Khá');
      expect(getGrade(79)?.label).toBe('Khá');
    });

    it('should return Trung bình for scores 50-64', () => {
      expect(getGrade(50)?.label).toBe('Trung bình');
      expect(getGrade(55)?.label).toBe('Trung bình');
      expect(getGrade(64)?.label).toBe('Trung bình');
    });

    it('should return Yếu for scores 35-49', () => {
      expect(getGrade(35)?.label).toBe('Yếu');
      expect(getGrade(40)?.label).toBe('Yếu');
      expect(getGrade(49)?.label).toBe('Yếu');
    });

    it('should return Kém for scores 0-34', () => {
      expect(getGrade(0)?.label).toBe('Kém');
      expect(getGrade(20)?.label).toBe('Kém');
      expect(getGrade(34)?.label).toBe('Kém');
    });

    it('should handle edge cases', () => {
      expect(getGrade(null)).toBeNull();
      expect(getGrade(undefined)).toBeNull();
      expect(getGrade(-5)).toBeNull();
      expect(getGrade(105)?.label).toBe('Xuất sắc'); // Fallback to highest grade
    });

    it('should return correct colors', () => {
      expect(getGrade(95)?.color).toBe('text-purple-600');
      expect(getGrade(85)?.color).toBe('text-blue-600');
      expect(getGrade(70)?.color).toBe('text-green-600');
      expect(getGrade(55)?.color).toBe('text-yellow-600');
      expect(getGrade(40)?.color).toBe('text-orange-600');
      expect(getGrade(20)?.color).toBe('text-red-600');
    });
  });

  describe('getGradeLabel', () => {
    it('should return correct labels', () => {
      expect(getGradeLabel(95)).toBe('Xuất sắc');
      expect(getGradeLabel(85)).toBe('Giỏi');
      expect(getGradeLabel(70)).toBe('Khá');
      expect(getGradeLabel(55)).toBe('Trung bình');
      expect(getGradeLabel(40)).toBe('Yếu');
      expect(getGradeLabel(20)).toBe('Kém');
    });

    it('should return empty string for invalid scores', () => {
      expect(getGradeLabel(null)).toBe('');
      expect(getGradeLabel(undefined)).toBe('');
      expect(getGradeLabel(-5)).toBe('');
    });
  });

  describe('getGradeColors', () => {
    it('should return correct colors for valid scores', () => {
      const colors95 = getGradeColors(95);
      expect(colors95.color).toBe('text-purple-600');
      expect(colors95.bgColor).toBe('bg-purple-100');

      const colors85 = getGradeColors(85);
      expect(colors85.color).toBe('text-blue-600');
      expect(colors85.bgColor).toBe('bg-blue-100');
    });

    it('should return gray colors for invalid scores', () => {
      const colors = getGradeColors(null);
      expect(colors.color).toBe('text-gray-600');
      expect(colors.bgColor).toBe('bg-gray-100');
    });
  });

  describe('GRADE_SCALE', () => {
    it('should have 6 grade levels', () => {
      expect(GRADE_SCALE).toHaveLength(6);
    });

    it('should cover all score ranges 0-100', () => {
      // Check that all scores from 0-100 have a grade
      for (let score = 0; score <= 100; score++) {
        const grade = getGrade(score);
        expect(grade).not.toBeNull();
      }
    });

    it('should have no overlapping ranges', () => {
      for (let i = 0; i < GRADE_SCALE.length - 1; i++) {
        const current = GRADE_SCALE[i];
        const next = GRADE_SCALE[i + 1];
        expect(current.minScore).toBeGreaterThan(next.maxScore);
      }
    });
  });
});
