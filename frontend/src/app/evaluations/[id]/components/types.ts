import type { Evaluation, Rubric, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';

export interface EvaluationHeaderProps {
  evaluation: Evaluation;
  totalScore: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface EvaluationScoreTableProps {
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  canScore: boolean;
  isClassMonitor: boolean;
  isAdvisor: boolean;
  classMonitorScores: Record<string, number>;
  advisorScores: Record<string, number>;
  aiScores: Record<string, { score: number; maxScore: number; loading?: boolean }>;
  onScoreChange: (
    criteriaId: number,
    subCriteriaId: string,
    score: number,
    role: 'classMonitor' | 'advisor'
  ) => void;
}

export interface EvaluationActionsProps {
  evaluation: Evaluation;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canAppeal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onApprove: (
    comment: string,
    scores: Record<number, number>,
    subCriteriaScores: Record<string, number>
  ) => void;
  criteriaWithSubCriteria: CriteriaWithSubCriteria[];
  isClassMonitor: boolean;
  isAdvisor: boolean;
  submitting: boolean;
}

export interface RejectionDialogProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  submitting: boolean;
}
