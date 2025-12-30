/**
 * Hook for auto-filling scores with localStorage persistence
 */

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  saveDraftScoresToStorage,
  loadDraftScoresFromStorage,
  clearAllDraftScoresForEvaluation,
} from '@/lib/draft-scores-storage';
import {
  autoFillClassMonitorScores,
  autoFillAdvisorScores,
} from '@/lib/score-auto-fill';
import type { CriteriaWithSubCriteria } from '@/types/evaluation';

interface UseAutoFillScoresProps {
  evaluationId: number;
  showApproveDialog: boolean;
  isClassMonitor: boolean;
  isAdvisor: boolean;
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  classMonitorSubCriteriaScores: Record<string, number>;
  setClassMonitorSubCriteriaScores: (scores: Record<string, number>) => void;
  setAdvisorSubCriteriaScores: (scores: Record<string, number>) => void;
}

export function useAutoFillScores({
  evaluationId,
  showApproveDialog,
  isClassMonitor,
  isAdvisor,
  criteriaWithSubCriteria,
  classMonitorSubCriteriaScores,
  setClassMonitorSubCriteriaScores,
  setAdvisorSubCriteriaScores,
}: UseAutoFillScoresProps) {
  const { toast } = useToast();
  const hasAutoFilled = useRef(false);

  // Auto-fill is now done on page load, not when dialog opens
  // This hook is disabled - keeping it for backward compatibility
  useEffect(() => {
    // Do nothing - auto-fill happens on page load now
    return;
  }, [showApproveDialog]);

  return {
    clearDraftScores: () => clearAllDraftScoresForEvaluation(evaluationId),
  };
}
