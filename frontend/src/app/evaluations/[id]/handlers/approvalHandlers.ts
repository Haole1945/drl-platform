import type { CriteriaWithSubCriteria, ScoreAdjustment } from '@/types/evaluation';
import { approveEvaluation } from '@/lib/evaluation';

interface ApprovalHandlerParams {
  evaluationId: number;
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  classMonitorSubCriteriaScores: Record<string, number>;
  advisorSubCriteriaScores: Record<string, number>;
  scoreAdjustmentNotes: Record<string, ScoreAdjustment>;
  approvalComment: string;
  isClassMonitor: boolean;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

export async function handleApprovalWithAdjustments({
  evaluationId,
  criteriaWithSubCriteria,
  classMonitorSubCriteriaScores,
  advisorSubCriteriaScores,
  scoreAdjustmentNotes,
  approvalComment,
  isClassMonitor,
  onSuccess,
  onError,
}: ApprovalHandlerParams) {
  try {
    // Prepare scores - calculate total for each criterion
    const scores: Record<number, number> = {};
    
    criteriaWithSubCriteria.forEach(criterion => {
      const totalScore = criterion.subCriteria.reduce((sum, sub) => {
        const key = `${criterion.id}_${sub.id}`;
        const score = isClassMonitor 
          ? classMonitorSubCriteriaScores[key] 
          : advisorSubCriteriaScores[key];
        return sum + (score || 0);
      }, 0);
      scores[criterion.id] = totalScore;
    });
    
    // Prepare sub-criteria scores
    const subCriteriaScores = isClassMonitor 
      ? classMonitorSubCriteriaScores 
      : advisorSubCriteriaScores;
    
    // Call API with correct parameters
    const response = await approveEvaluation(
      evaluationId,
      approvalComment || undefined,
      scores,
      subCriteriaScores
    );
    
    if (response.success) {
      onSuccess(response.data);
    } else {
      throw new Error(response.message || 'Không thể duyệt đánh giá');
    }
  } catch (error: any) {
    onError(error);
  }
}
