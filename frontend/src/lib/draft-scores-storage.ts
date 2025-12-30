/**
 * LocalStorage utilities for draft scores
 * Stores auto-filled scores temporarily until user approves
 */

const STORAGE_KEY_PREFIX = 'draft_scores_';

export interface DraftScores {
  evaluationId: number;
  scores: Record<string, number>; // "criteriaId_subCriteriaId" -> score
  role: 'CLASS_MONITOR' | 'ADVISOR';
  timestamp: number;
}

/**
 * Save draft scores to localStorage
 */
export function saveDraftScoresToStorage(
  evaluationId: number,
  scores: Record<string, number>,
  role: 'CLASS_MONITOR' | 'ADVISOR'
): void {
  const key = `${STORAGE_KEY_PREFIX}${evaluationId}_${role}`;
  const data: DraftScores = {
    evaluationId,
    scores,
    role,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[DRAFT] Failed to save to localStorage:', error);
  }
}

/**
 * Load draft scores from localStorage
 */
export function loadDraftScoresFromStorage(
  evaluationId: number,
  role: 'CLASS_MONITOR' | 'ADVISOR'
): Record<string, number> | null {
  const key = `${STORAGE_KEY_PREFIX}${evaluationId}_${role}`;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const data: DraftScores = JSON.parse(stored);
    
    // Check if data is too old (> 24 hours)
    const age = Date.now() - data.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      // Remove old data
      localStorage.removeItem(key);
      return null;
    }
    
    return data.scores;
  } catch (error) {
    console.error('[DRAFT] Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear draft scores from localStorage (after approval)
 */
export function clearDraftScoresFromStorage(
  evaluationId: number,
  role: 'CLASS_MONITOR' | 'ADVISOR'
): void {
  const key = `${STORAGE_KEY_PREFIX}${evaluationId}_${role}`;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[DRAFT] Failed to clear from localStorage:', error);
  }
}

/**
 * Clear all draft scores for an evaluation
 */
export function clearAllDraftScoresForEvaluation(evaluationId: number): void {
  clearDraftScoresFromStorage(evaluationId, 'CLASS_MONITOR');
  clearDraftScoresFromStorage(evaluationId, 'ADVISOR');
}
