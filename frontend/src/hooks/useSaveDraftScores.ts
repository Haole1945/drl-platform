/**
 * Hook to save draft scores to localStorage when user edits
 */

import { useEffect, useRef } from 'react';
import { saveDraftScoresToStorage } from '@/lib/draft-scores-storage';

interface UseSaveDraftScoresProps {
  evaluationId: number;
  scores: Record<string, number>;
  role: 'CLASS_MONITOR' | 'ADVISOR';
  enabled: boolean; // Only save when dialog is open
}

export function useSaveDraftScores({
  evaluationId,
  scores,
  role,
  enabled,
}: UseSaveDraftScoresProps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only save if enabled and has scores
    if (!enabled || Object.keys(scores).length === 0) {
      return;
    }

    // Save to localStorage
    saveDraftScoresToStorage(evaluationId, scores, role);
  }, [evaluationId, scores, role, enabled]);

  // Reset flag when disabled
  useEffect(() => {
    if (!enabled) {
      isFirstRender.current = true;
    }
  }, [enabled]);
}
