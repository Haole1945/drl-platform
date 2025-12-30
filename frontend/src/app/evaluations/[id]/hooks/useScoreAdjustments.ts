import { useState } from 'react';
import type { SubCriteria, ScoreAdjustment } from '@/types/evaluation';

export function useScoreAdjustments() {
  const [scoreAdjustmentNotes, setScoreAdjustmentNotes] = useState<Record<string, ScoreAdjustment>>({});
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [currentAdjustment, setCurrentAdjustment] = useState<{
    criterionId: number;
    subCriteria: SubCriteria;
    currentScore: number;
  } | null>(null);

  const openAdjustmentDialog = (
    criterionId: number,
    subCriteria: SubCriteria,
    currentScore: number
  ) => {
    setCurrentAdjustment({ criterionId, subCriteria, currentScore });
    setAdjustmentDialogOpen(true);
  };

  const handleSaveAdjustmentNote = (reason: string, evidence: string, role: string) => {
    if (!currentAdjustment) return;
    
    const key = `${role}_${currentAdjustment.criterionId}_${currentAdjustment.subCriteria.id}`;
    
    setScoreAdjustmentNotes(prev => ({
      ...prev,
      [key]: {
        originalScore: currentAdjustment.subCriteria.score,
        newScore: currentAdjustment.currentScore,
        reason,
        evidence,
      }
    }));
  };

  return {
    scoreAdjustmentNotes,
    setScoreAdjustmentNotes,
    adjustmentDialogOpen,
    setAdjustmentDialogOpen,
    currentAdjustment,
    openAdjustmentDialog,
    handleSaveAdjustmentNote,
  };
}
