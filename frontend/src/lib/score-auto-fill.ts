/**
 * Score Auto-Fill Utilities
 * Logic for automatically filling scores when approving evaluations
 */

/**
 * Calculate advisor score from self score and class monitor score
 * Rules:
 * 1. Calculate average: avg = (selfScore + classMonitorScore) / 2
 * 2. Get integer part: intPart = Math.floor(avg)
 * 3. If there's a remainder:
 *    - If classMonitorScore > selfScore: round UP (Math.ceil)
 *    - If classMonitorScore < selfScore: round DOWN (Math.floor)
 *    - If classMonitorScore = selfScore: no remainder (keep intPart)
 * 
 * @param selfScore - Student's self-assessment score
 * @param classMonitorScore - Class monitor's score (null/undefined treated as 0)
 * @returns Calculated advisor score
 */
export function calculateAdvisorScore(
  selfScore: number | null | undefined,
  classMonitorScore: number | null | undefined
): number {
  // Treat null/undefined as 0
  const self = selfScore ?? 0;
  const monitor = classMonitorScore ?? 0;
  
  // Calculate average
  const avg = (self + monitor) / 2;
  
  // Get integer part
  const intPart = Math.floor(avg);
  
  // Check if there's a remainder
  const remainder = avg - intPart;
  
  // If no remainder, return integer part
  if (remainder === 0) {
    return intPart;
  }
  
  // If class monitor score > self score: round UP
  if (monitor > self) {
    return Math.ceil(avg);
  }
  
  // If class monitor score < self score: round DOWN
  if (monitor < self) {
    return Math.floor(avg);
  }
  
  // If equal (shouldn't have remainder, but just in case)
  return intPart;
}

/**
 * Auto-fill class monitor scores from self scores
 * Class monitor scores are initialized to match student's self-assessment scores
 * 
 * @param subCriteria - Array of sub-criteria with scores
 * @param criterionId - ID of the criterion
 * @returns Record of subCriteriaKey -> score
 */
export function autoFillClassMonitorScores(
  subCriteria: Array<{ id: string; score: number }>,
  criterionId: number
): Record<string, number> {
  const scores: Record<string, number> = {};
  
  subCriteria.forEach(sub => {
    const key = `${criterionId}_${sub.id}`;
    scores[key] = sub.score ?? 0;
  });
  
  return scores;
}

/**
 * Auto-fill advisor scores from class monitor scores
 * Advisor scores are initialized to match class monitor scores
 * 
 * @param subCriteria - Array of sub-criteria with scores
 * @param criterionId - ID of the criterion
 * @param classMonitorScores - Record of class monitor scores
 * @returns Record of subCriteriaKey -> score
 */
export function autoFillAdvisorScores(
  subCriteria: Array<{ id: string; score: number }>,
  criterionId: number,
  classMonitorScores: Record<string, number>
): Record<string, number> {
  const scores: Record<string, number> = {};
  
  subCriteria.forEach(sub => {
    const key = `${criterionId}_${sub.id}`;
    // Use class monitor score directly (not average)
    const monitorScore = classMonitorScores[key] ?? 0;
    scores[key] = monitorScore;
  });
  
  return scores;
}

/**
 * Get auto-fill message based on approver role
 */
export function getAutoFillMessage(isClassMonitor: boolean): string {
  if (isClassMonitor) {
    return 'Điểm đã được tự động điền từ điểm tự chấm của sinh viên. Bạn có thể chỉnh sửa nếu cần.';
  } else {
    return 'Điểm đã được tự động điền từ điểm lớp trưởng. Bạn có thể chỉnh sửa nếu cần.';
  }
}
