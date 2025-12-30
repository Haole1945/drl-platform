"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getEvaluationById, submitEvaluation, approveEvaluation, rejectEvaluation, getActiveRubric, getCriteriaByRubric, deleteEvaluation, saveDraftScores } from '@/lib/evaluation';
import { StatusBadge } from '@/components/StatusBadge';
import { EvaluationHistory } from '@/components/EvaluationHistory';
import { canApproveClassLevel, canApproveAdvisorLevel, canApproveFacultyLevel } from '@/lib/role-utils';
import type { Evaluation, Rubric, Criteria, CriteriaWithSubCriteria,SubCriteria } from '@/types/evaluation';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Check, X, Edit, ExternalLink, Trash2, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { getOpenPeriod , getAuthToken} from '@/lib/api';
import { parseSubCriteria } from '@/lib/criteria-parser';
import { parseEvidence, getFileNameFromUrl } from '@/lib/evidence-parser';
import { formatDateTime, formatDate as formatDateUtil } from '@/lib/date-utils';
import { getScoringsuggestion } from '@/lib/api/ai-scoring';
import { AppealButton } from '@/components/AppealButton';
import { autoFillClassMonitorScores, autoFillAdvisorScores, getAutoFillMessage } from '@/lib/score-auto-fill';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useAutoFillScores } from '@/hooks/useAutoFillScores';
import { useSaveDraftScores } from '@/hooks/useSaveDraftScores';
import { ScoreAdjustmentDialog } from '@/components/ScoreAdjustmentDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScoreAdjustments } from './hooks/useScoreAdjustments';
import { SubCriteriaScoreInput } from './components/SubCriteriaScoreInput';
import { handleApprovalWithAdjustments } from './handlers/approvalHandlers';


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EvaluationDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalScores, setApprovalScores] = useState<Record<number, number>>({}); // criteriaId -> score
  const [classMonitorSubCriteriaScores, setClassMonitorSubCriteriaScores] = useState<Record<string, number>>({}); // "criterionId_subCriteriaId" -> score (for class monitor)
  const [advisorSubCriteriaScores, setAdvisorSubCriteriaScores] = useState<Record<string, number>>({}); // "criterionId_subCriteriaId" -> score (for advisor)
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [autoFilledScores, setAutoFilledScores] = useState(false); // Track if scores were auto-filled
  const [openPeriod, setOpenPeriod] = useState<any>(null);
  const [canEditInPeriod, setCanEditInPeriod] = useState(false);
  const [criteriaFiles, setCriteriaFiles] = useState<Record<number, number[]>>({}); // criteriaId -> fileIds[]
  const [aiScores, setAiScores] = useState<Record<string, { score: number; maxScore: number; loading?: boolean }>>({}); // subCriteriaId -> { score, maxScore }
  const [studentInfo, setStudentInfo] = useState<{ studentCode: string; fullName: string; className?: string } | null>(null);
  
  // Score adjustment notes - using custom hook
  // Determine current user's role for adjustment notes
  const currentUserRole = useMemo(() => {
    if (!user) return null;
    if (canApproveClassLevel(user)) return 'classMonitor';
    if (canApproveAdvisorLevel(user)) return 'advisor';
    return null;
  }, [user]);
  
  const {
    scoreAdjustmentNotes,
    setScoreAdjustmentNotes,
    adjustmentDialogOpen,
    setAdjustmentDialogOpen,
    currentAdjustment,
    openAdjustmentDialog,
    handleSaveAdjustmentNote,
  } = useScoreAdjustments();
  
  // Wrapper functions that add role prefix
  const getAdjustmentNote = (criterionId: number, subCriteriaId: string, role?: string) => {
    const roleToUse = role || currentUserRole || 'classMonitor';
    const key = `${roleToUse}_${criterionId}_${subCriteriaId}`;
    return scoreAdjustmentNotes[key];
  };
  
  const hasAdjustmentNote = (criterionId: number, subCriteriaId: string, role?: string) => {
    const roleToUse = role || currentUserRole || 'classMonitor';
    const key = `${roleToUse}_${criterionId}_${subCriteriaId}`;
    const hasNote = !!scoreAdjustmentNotes[key];
    console.log('[ICON-CHECK] hasAdjustmentNote:', { criterionId, subCriteriaId, role: roleToUse, key, hasNote, allKeys: Object.keys(scoreAdjustmentNotes) });
    return hasNote;
  };
  
  // Use ref to track if auto-fill has been attempted (to prevent infinite loop)
  const autoFillAttempted = useRef(false);

  const evaluationId = params?.id ? parseInt(params.id as string) : null;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

  // Parse criteria with sub-criteria and map with evaluation details
  const criteriaWithSubCriteria = useMemo<CriteriaWithSubCriteria[]>(() => {
    if (!criteria.length || !evaluation) return [];

    return criteria.map(criterion => {
      const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
      const detail = evaluation.details.find(d => d.criteriaId === criterion.id);
      
      // Parse evidence to get sub-criteria scores and files
      const parsedEvidence = detail?.evidence ? parseEvidence(detail.evidence) : [];
      
      // Map sub-criteria with scores and evidence
      // Scores are now stored in evidence string with format: "SCORES:1.1=3,1.2=10|EVIDENCE:..."
      const subCriteriaWithData = subCriteria.map(sub => {
        const evidenceData = parsedEvidence.find(e => e.subCriteriaId === sub.id);
        // Get score from parsed evidence (if available)
        // Check if score is explicitly defined (including 0)
        const scoreEntry = parsedEvidence.find(e => e.subCriteriaId === sub.id);
        const hasExplicitScore = scoreEntry !== undefined && scoreEntry.score !== undefined;
        let score = hasExplicitScore ? scoreEntry.score! : 0;
        
        // FALLBACK: Only distribute if NO explicit score exists (not even 0) and we have a total score
        if (!hasExplicitScore && detail?.score && detail.score > 0) {
          const totalMaxPoints = subCriteria.reduce((sum, s) => sum + s.maxPoints, 0);
          const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
          score = Math.round(detail.score * ratio * 10) / 10;
        }
        
        // Convert fileUrls to string (comma-separated URLs)
        const evidenceString = (evidenceData?.fileUrls || []).join(', ');
        
        return {
          ...sub,
          score: score, // Use score from parsed evidence or distributed
          evidence: evidenceString, // Store as string to match SubCriteria type
        };
      });

      // Get scores from detail
      const studentScore = detail?.score || detail?.selfScore || 0;
      const classMonitorScore = detail?.classMonitorScore || null;
      const advisorScore = detail?.advisorScore || null;
      
      // Calculate total score (use advisor score if available, else class monitor, else student)
      const finalScore = advisorScore ?? classMonitorScore ?? studentScore;
      
      return {
        ...criterion,
        subCriteria: subCriteriaWithData,
        totalScore: studentScore,
        classMonitorScore: classMonitorScore ?? undefined,
        advisorScore: advisorScore ?? undefined,
        finalScore: finalScore, // Score to display (advisor > class monitor > student)
      };
    });
  }, [criteria, evaluation]);

  // Auto-fill is now done on page load, not when dialog opens
  // Keeping hooks for backward compatibility but they do nothing now
  const { clearDraftScores } = useAutoFillScores({
    evaluationId: evaluationId!,
    showApproveDialog,
    isClassMonitor: user ? canApproveClassLevel(user) : false,
    isAdvisor: user ? canApproveAdvisorLevel(user) : false,
    criteriaWithSubCriteria,
    classMonitorSubCriteriaScores,
    setClassMonitorSubCriteriaScores,
    setAdvisorSubCriteriaScores,
  });

  // No longer saving to localStorage - scores are auto-filled on page load
  // useSaveDraftScores({
  //   evaluationId: evaluationId!,
  //   scores: classMonitorSubCriteriaScores,
  //   role: 'CLASS_MONITOR',
  //   enabled: showApproveDialog && user ? canApproveClassLevel(user) : false,
  // });

  // useSaveDraftScores({
  //   evaluationId: evaluationId!,
  //   scores: advisorSubCriteriaScores,
  //   role: 'ADVISOR',
  //   enabled: showApproveDialog && user ? canApproveAdvisorLevel(user) : false,
  // });

  // Use shared date utility for consistent formatting
  const formatDate = formatDateTime;

  // Calculate total score - use API value first, fallback to calculated from details
  const totalScore = useMemo(() => {
    // Prefer totalScore/totalPoints from API (more reliable)
    if (evaluation?.totalPoints !== undefined && evaluation.totalPoints !== null) {
      return evaluation.totalPoints;
    }
    if (evaluation?.totalScore !== undefined && evaluation.totalScore !== null) {
      return evaluation.totalScore;
    }
    // Fallback: calculate from criteria details
    return criteriaWithSubCriteria.reduce((sum, c) => sum + c.totalScore, 0);
  }, [criteriaWithSubCriteria, evaluation]);

  // Helper function to check if score was adjusted BY USER (not auto-fill)
  // Show icon ONLY when user manually changed the score
  const isScoreAdjusted = (criterionId: number, subCriteriaId: string, originalScore: number, role: 'classMonitor' | 'advisor') => {
    const key = `${criterionId}_${subCriteriaId}`;
    
    // ONLY check if there's an adjustment note
    // Don't check score difference because auto-fill also changes scores
    return hasAdjustmentNote(criterionId, subCriteriaId, role);
  };

  useEffect(() => {
    if (!evaluationId) {
      router.push('/evaluations');
      return;
    }

    const loadData = async () => {
      try {
        // Load evaluation
        const evalResponse = await getEvaluationById(evaluationId);
        if (!evalResponse.success || !evalResponse.data) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy đánh giá.",
            variant: "destructive"
          });
          router.push('/evaluations');
          return;
        }

        const evalData = evalResponse.data;
        setEvaluation(evalData);

        // Load rubric and criteria
        const classCode = user?.classCode;
        const rubricResponse = await getActiveRubric(undefined, classCode);
        if (rubricResponse.success && rubricResponse.data) {
          setRubric(rubricResponse.data);
          
          const criteriaResponse = await getCriteriaByRubric(rubricResponse.data.id);
          if (criteriaResponse.success && criteriaResponse.data) {
            setCriteria(criteriaResponse.data);
            
            // Initialize sub-criteria scores from existing scores if available
            const initialClassMonitorScores: Record<string, number> = {};
            const initialAdvisorScores: Record<string, number> = {};
            
            // Always load scores from database when evaluation data is available
            if (evalData.details) {
              evalData.details.forEach(detail => {
                // Find the criterion
                const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);
                if (criterion) {
                  // Parse sub-criteria from description
                  const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
                  if (subCriteria && subCriteria.length > 0) {
                    // Try to parse sub-criteria scores from comment (JSON format)
                  // Note: comment is mapped to both note and evidence in DTO
                  // note contains the raw comment, evidence may have prefix removed
                  let parsedSubCriteriaScores: any = null;
                  // Use note first (raw comment), fallback to evidence
                  const commentText = detail.note || detail.evidence;
                  
                  console.log('[PARSE-JSON] Criteria', detail.criteriaId, 'comment:', commentText);
                  
                  if (commentText && commentText.trim().startsWith('{')) {
                    // It's JSON, parse it
                    try {
                      const parsed = JSON.parse(commentText);
                      console.log('[PARSE-JSON] Parsed successfully:', parsed);
                      console.log('[PARSE-JSON] Keys:', Object.keys(parsed));
                      if (parsed.scores) {
                        parsedSubCriteriaScores = parsed.scores;
                      }
                      
                      // Parse score adjustments if available - SEPARATE by role
                      // Load class monitor adjustments - ALWAYS load for viewing mode
                      if (parsed.classMonitorAdjustments) {
                        const adjustments = parsed.classMonitorAdjustments;
                        console.log('[ADJUSTMENT-LOAD] Loading class monitor adjustments:', adjustments);
                        Object.entries(adjustments).forEach(([key, adjustment]: [string, any]) => {
                          if (adjustment && typeof adjustment === 'object') {
                            const fullKey = `classMonitor_${key}`;
                            console.log('[ADJUSTMENT-LOAD] Setting adjustment:', fullKey, adjustment);
                            setScoreAdjustmentNotes(prev => ({
                              ...prev,
                              [fullKey]: {
                                originalScore: adjustment.originalScore || 0,
                                newScore: adjustment.newScore || 0,
                                reason: adjustment.reason || '',
                                evidence: adjustment.evidence || '',
                              }
                            }));
                          }
                        });
                      } else {
                        console.log('[ADJUSTMENT-LOAD] No class monitor adjustments found');
                      }
                      
                      // Load advisor adjustments - ALWAYS load for viewing mode
                      if (parsed.advisorAdjustments) {
                        const adjustments = parsed.advisorAdjustments;
                        console.log('[ADJUSTMENT-LOAD] Loading advisor adjustments:', adjustments);
                        Object.entries(adjustments).forEach(([key, adjustment]: [string, any]) => {
                          if (adjustment && typeof adjustment === 'object') {
                            const fullKey = `advisor_${key}`;
                            console.log('[ADJUSTMENT-LOAD] Setting adjustment:', fullKey, adjustment);
                            setScoreAdjustmentNotes(prev => ({
                              ...prev,
                              [fullKey]: {
                                originalScore: adjustment.originalScore || 0,
                                newScore: adjustment.newScore || 0,
                                reason: adjustment.reason || '',
                                evidence: adjustment.evidence || '',
                              }
                            }));
                          }
                        });
                      } else {
                        console.log('[ADJUSTMENT-LOAD] No advisor adjustments found');
                      }
                      
                      if (!parsed.classMonitorAdjustments && !parsed.advisorAdjustments) {
                        // No adjustments found
                      }
                    } catch (e) {
                      // JSON parse failed - ignore
                    }
                  } else if (commentText) {
                    // Not JSON (evidence string), will fallback to distribution
                  }
                  
                  // If we have saved sub-criteria scores in JSON, use them
                  if (parsedSubCriteriaScores) {
                    if (parsedSubCriteriaScores.classMonitorSubCriteria) {
                      Object.entries(parsedSubCriteriaScores.classMonitorSubCriteria).forEach(([subId, score]: [string, any]) => {
                        const subScoreKey = `${detail.criteriaId}_${subId}`;
                        initialClassMonitorScores[subScoreKey] = Number(score);
                      });
                    }
                    if (parsedSubCriteriaScores.advisorSubCriteria) {
                      Object.entries(parsedSubCriteriaScores.advisorSubCriteria).forEach(([subId, score]: [string, any]) => {
                        const subScoreKey = `${detail.criteriaId}_${subId}`;
                        initialAdvisorScores[subScoreKey] = Number(score);
                      });
                    }
                  } else {
                    // Fallback: distribute total score proportionally (for backward compatibility)
                    const totalMaxPoints = subCriteria.reduce((sum: number, s: any) => sum + s.maxPoints, 0);
                    // If class monitor score exists, distribute it
                    if (detail.classMonitorScore != null && detail.classMonitorScore !== undefined) {
                      subCriteria.forEach((sub: any) => {
                        const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
                        const distributedScore = Math.round(detail.classMonitorScore! * ratio * 10) / 10;
                        const subScoreKey = `${detail.criteriaId}_${sub.id}`;
                        initialClassMonitorScores[subScoreKey] = distributedScore;
                      });
                    }
                    // If advisor score exists, distribute it separately
                    if (detail.advisorScore != null && detail.advisorScore !== undefined) {
                      subCriteria.forEach((sub: any) => {
                        const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
                        const distributedScore = Math.round(detail.advisorScore! * ratio * 10) / 10;
                        const subScoreKey = `${detail.criteriaId}_${sub.id}`;
                        initialAdvisorScores[subScoreKey] = distributedScore;
                      });
                    }
                  }
                  }
                }
              });
              
              if (Object.keys(initialClassMonitorScores).length > 0) {
                setClassMonitorSubCriteriaScores(initialClassMonitorScores);
              } else {
                // Auto-fill class monitor scores if user is class monitor and no scores exist
                if (user && canApproveClassLevel(user) && evalData.status === 'SUBMITTED') {
                  const autoFilledScores: Record<string, number> = {};
                  
                  // Loop through each criterion and auto-fill from self scores
                  criteriaResponse.data.forEach((criterion: Criteria) => {
                    const detail = evalData.details.find((d: any) => d.criteriaId === criterion.id);
                    if (detail) {
                      const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
                      const parsedEvidence = detail.evidence ? parseEvidence(detail.evidence) : [];
                      
                      // Map sub-criteria with their scores
                      const subCriteriaWithScores = subCriteria.map(sub => {
                        const scoreEntry = parsedEvidence.find(e => e.subCriteriaId === sub.id);
                        const score = scoreEntry?.score ?? 0;
                        return { id: sub.id, score };
                      });
                      
                      // Auto-fill scores for this criterion
                      const criterionScores = autoFillClassMonitorScores(subCriteriaWithScores, criterion.id);
                      Object.assign(autoFilledScores, criterionScores);
                    }
                  });
                  
                  if (Object.keys(autoFilledScores).length > 0) {
                    setClassMonitorSubCriteriaScores(autoFilledScores);
                    
                    // Show toast notification
                    toast({
                      title: "Điểm đã được tự động điền",
                      description: "Điểm lớp trưởng đã được tự động điền từ điểm tự chấm của sinh viên. Bạn có thể chỉnh sửa trước khi duyệt.",
                      duration: 5000,
                    });
                  }
                }
              }
              if (Object.keys(initialAdvisorScores).length > 0) {
                setAdvisorSubCriteriaScores(initialAdvisorScores);
              } else {
                // Auto-fill advisor scores if user is advisor and no scores exist
                if (user && canApproveAdvisorLevel(user) && evalData.status === 'CLASS_APPROVED') {
                  const autoFilledScores: Record<string, number> = {};
                  
                  // Loop through each criterion and auto-fill from average
                  criteriaResponse.data.forEach((criterion: Criteria) => {
                    const detail = evalData.details.find((d: any) => d.criteriaId === criterion.id);
                    if (detail) {
                      const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
                      const parsedEvidence = detail.evidence ? parseEvidence(detail.evidence) : [];
                      
                      // Map sub-criteria with their scores
                      const subCriteriaWithScores = subCriteria.map(sub => {
                        const scoreEntry = parsedEvidence.find(e => e.subCriteriaId === sub.id);
                        const score = scoreEntry?.score ?? 0;
                        return { id: sub.id, score };
                      });
                      
                      // Auto-fill scores for this criterion (using class monitor scores if available)
                      const criterionScores = autoFillAdvisorScores(subCriteriaWithScores, criterion.id, initialClassMonitorScores);
                      Object.assign(autoFilledScores, criterionScores);
                    }
                  });
                  
                  if (Object.keys(autoFilledScores).length > 0) {
                    setAdvisorSubCriteriaScores(autoFilledScores);
                    
                    // Show toast notification
                    toast({
                      title: "Điểm đã được tự động điền",
                      description: "Điểm cố vấn đã được tự động điền từ điểm lớp trưởng. Bạn có thể chỉnh sửa trước khi duyệt.",
                      duration: 5000,
                    });
                  }
                }
              }
            }
            
            // Fetch file IDs for each criteria
            const filesMap: Record<number, number[]> = {};
            const token = getAuthToken();
            console.log('[AI Debug] Starting file fetch - token:', !!token, 'evaluationId:', evaluationId, 'criteriaCount:', criteriaResponse.data.length);
            
            if (token && evaluationId) {
              console.log('[AI Debug] Fetching files for evaluation:', evaluationId);
              
              // First, try to get files from API
              await Promise.all(
                criteriaResponse.data.map(async (criterion: Criteria) => {
                  try {
                    const url = `${API_BASE}/files/evaluation/${evaluationId}/criteria/${criterion.id}`;
                    console.log('[AI Debug] Fetching files for criteria:', criterion.id, 'URL:', url);
                    const response = await fetch(url, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    });
                    console.log('[AI Debug] Response status for criteria', criterion.id, ':', response.status);
                    if (response.ok) {
                      const data = await response.json();
                      console.log('[AI Debug] Files response for criteria', criterion.id, ':', data);
                      if (data.success && data.data && Array.isArray(data.data)) {
                        const fileIds = data.data.map((f: any) => f.id).filter((id: any) => id != null);
                        if (fileIds.length > 0) {
                          filesMap[criterion.id] = fileIds;
                          console.log('[AI Debug] File IDs for criteria', criterion.id, ':', fileIds);
                        } else {
                          console.log('[AI Debug] No file IDs found for criteria', criterion.id);
                        }
                      } else {
                        console.log('[AI Debug] No files in response for criteria', criterion.id, 'data:', data);
                      }
                    } else {
                      const errorText = await response.text().catch(() => '');
                      console.warn('[AI Debug] Failed to fetch files for criteria', criterion.id, 'Status:', response.status, 'Error:', errorText);
                    }
                  } catch (err) {
                    console.error('[AI Debug] Error fetching files for criteria', criterion.id, ':', err);
                  }
                })
              );
              
              // If no files found via API, try to sync files with evaluation
              // This is a one-time fix for existing evaluations where files weren't linked
              if (Object.keys(filesMap).length === 0 && evalData.details) {
                const hasEvidence = evalData.details.some((d: any) => d.evidence && d.evidence.match(/\/files\/evidence\/[^\s,]+/g));
                
                if (hasEvidence) {
                  console.log('[AI Debug] No files from API but evidence exists, syncing files with evaluation');
                  
                  try {
                    // Call sync endpoint to link files with evaluation
                    const syncUrl = `${API_BASE}/evaluations/${evaluationId}/sync-files`;
                    const syncResponse = await fetch(syncUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (syncResponse.ok) {
                      console.log('[AI Debug] Files synced successfully, fetching again');
                      // Wait a moment for database to update
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      // Fetch files again after sync
                      await Promise.all(
                        criteriaResponse.data.map(async (criterion: Criteria) => {
                          try {
                            const url = `${API_BASE}/files/evaluation/${evaluationId}/criteria/${criterion.id}`;
                            const response = await fetch(url, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.data && Array.isArray(data.data)) {
                                const fileIds = data.data.map((f: any) => f.id).filter((id: any) => id != null);
                                if (fileIds.length > 0) {
                                  filesMap[criterion.id] = fileIds;
                                  console.log('[AI Debug] Found file IDs after sync for criterion', criterion.id, ':', fileIds);
                                }
                              }
                            }
                          } catch (err) {
                            console.error('[AI Debug] Error fetching files after sync:', err);
                          }
                        })
                      );
                    } else {
                      const errorText = await syncResponse.text().catch(() => '');
                      console.warn('[AI Debug] Sync failed, Status:', syncResponse.status, 'Error:', errorText);
                    }
                  } catch (err) {
                    console.error('[AI Debug] Error syncing files:', err);
                  }
                }
              }
              
              // If still no files found, try alternative approach: lookup files by evidence URLs
              if (Object.keys(filesMap).length === 0 && evalData.details) {
                console.log('[AI Debug] Still no files found, trying alternative lookup approach');
                
                for (const detail of evalData.details) {
                  if (detail.evidence) {
                    // Extract file names from evidence URLs
                    const fileUrlPattern = /\/files\/evidence\/[^\/]+\/[^\/]+\/([^\s,]+)/g;
                    const fileNames: string[] = [];
                    let match;
                    while ((match = fileUrlPattern.exec(detail.evidence)) !== null) {
                      fileNames.push(match[1]);
                    }
                    
                    if (fileNames.length > 0) {
                      console.log('[AI Debug] Found file names in evidence for criteria', detail.criteriaId, ':', fileNames);
                      
                      try {
                        // Use file lookup endpoint to find files by stored names
                        const lookupUrl = `${API_BASE}/files/lookup`;
                        const lookupResponse = await fetch(lookupUrl, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            storedFileNames: fileNames,
                            criteriaId: detail.criteriaId
                          })
                        });
                        
                        if (lookupResponse.ok) {
                          const lookupData = await lookupResponse.json();
                          if (lookupData.success && lookupData.data && Array.isArray(lookupData.data)) {
                            const fileIds = lookupData.data.map((f: any) => f.id).filter((id: any) => id != null);
                            if (fileIds.length > 0) {
                              filesMap[detail.criteriaId] = fileIds;
                              console.log('[AI Debug] Found file IDs via lookup for criteria', detail.criteriaId, ':', fileIds);
                            }
                          }
                        } else {
                          console.warn('[AI Debug] File lookup failed for criteria', detail.criteriaId);
                        }
                      } catch (err) {
                        console.error('[AI Debug] Error in file lookup for criteria', detail.criteriaId, ':', err);
                      }
                    }
                  }
                }
              }
              
              console.log('[AI Debug] Final filesMap:', filesMap);
              setCriteriaFiles(filesMap);
            } else {
              console.warn('[AI Debug] Cannot fetch files - token:', !!token, 'evaluationId:', evaluationId);
            }
          }
        }
      } catch (error: any) {
        // If we reach here, it means all retries failed - this is a real error
        // Retry logic in API client handles transient errors automatically
        // Check if this is a 404 (evaluation not found) vs other errors
        const errorMessage = error?.message || '';
        const isNotFound = errorMessage.includes('404') || errorMessage.includes('Không tìm thấy');
        
        toast({
          title: "Lỗi",
          description: isNotFound 
            ? "Không tìm thấy đánh giá này." 
            : "Không thể tải đánh giá. Vui lòng thử lại sau.",
          variant: "destructive"
        });
        
        // Only redirect if it's a 404 or persistent error (not network/connection errors)
        // Network errors might be transient, so we don't redirect immediately
        const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('kết nối');
        if (isNotFound || !isNetworkError) {
          router.push('/evaluations');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evaluationId, router, toast]);

  // Helper function to parse date from string or number array [year, month, day]
  const parseDate = (dateValue: string | number[]): Date => {
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    if (Array.isArray(dateValue) && dateValue.length >= 3) {
      // Java LocalDate format: [year, month, day]
      // Note: JavaScript Date month is 0-indexed, Java LocalDate month is 1-indexed
      return new Date(dateValue[0], dateValue[1] - 1, dateValue[2]);
    }
    return new Date();
  };

  // Check if evaluation period is still open for editing (for submitted evaluations)
  useEffect(() => {
    const checkPeriod = async () => {
      if (evaluation && evaluation.status && (evaluation.status === 'SUBMITTED' || evaluation.status === 'CLASS_APPROVED' || evaluation.status === 'FACULTY_APPROVED')) {
        try {
          const periodResponse = await getOpenPeriod();
          if (periodResponse.success && periodResponse.data) {
            setOpenPeriod(periodResponse.data);
            // Check if current date is within period
            const today = new Date();
            const startDate = Array.isArray(periodResponse.data.startDate)
              ? new Date(periodResponse.data.startDate[0], periodResponse.data.startDate[1] - 1, periodResponse.data.startDate[2])
              : new Date(periodResponse.data.startDate);
            const endDate = Array.isArray(periodResponse.data.endDate)
              ? new Date(periodResponse.data.endDate[0], periodResponse.data.endDate[1] - 1, periodResponse.data.endDate[2])
              : new Date(periodResponse.data.endDate);
            setCanEditInPeriod(today >= startDate && today <= endDate);
          } else {
            setCanEditInPeriod(false);
          }
        } catch (error) {
          // Silently handle period check failure - it's not critical
          setCanEditInPeriod(false);
        }
      } else {
        setCanEditInPeriod(false);
      }
    };
    if (evaluation) {
      checkPeriod();
    }
  }, [evaluation]);

  // Load student info when evaluation is loaded
  useEffect(() => {
    const loadStudentInfo = async () => {
      if (!evaluation?.studentCode) return;
      
      try {
        const { getStudentByCode } = await import('@/lib/student');
        const response = await getStudentByCode(evaluation.studentCode);
        if (response.success && response.data) {
          setStudentInfo({
            studentCode: response.data.studentCode,
            fullName: response.data.fullName,
            className: response.data.className || response.data.classCode
          });
        }
      } catch (error) {
        console.error('[STUDENT-INFO] Failed to load student info:', error);
        // Fallback to evaluation data
        setStudentInfo({
          studentCode: evaluation.studentCode,
          fullName: evaluation.studentName || evaluation.studentCode,
          className: evaluation.className
        });
      }
    };
    
    loadStudentInfo();
  }, [evaluation]);

  // Auto-run AI analysis when files are loaded
  useEffect(() => {
    const runAiAnalysis = async () => {
      console.log('[AI-AUTO] Checking if should run AI analysis...', {
        hasCriteria: !!criteriaWithSubCriteria.length,
        hasFiles: !!Object.keys(criteriaFiles).length,
        hasEvaluation: !!evaluation,
        criteriaCount: criteriaWithSubCriteria.length,
        filesCount: Object.keys(criteriaFiles).length
      });
      
      if (!criteriaWithSubCriteria.length || !Object.keys(criteriaFiles).length || !evaluation) {
        console.log('[AI-AUTO] Skipping AI analysis - missing data');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        console.warn('[AI-AUTO] No auth token - skipping AI analysis');
        return;
      }

      console.log('[AI-AUTO] Starting AI analysis for', criteriaWithSubCriteria.length, 'criteria');

      // Run AI analysis for each criterion that has files
      for (const criterion of criteriaWithSubCriteria) {
        const fileIds = criteriaFiles[criterion.id] || [];
        console.log(`[AI-AUTO] Criterion ${criterion.id}:`, {
          fileCount: fileIds.length,
          subCriteriaCount: criterion.subCriteria.length
        });
        
        if (fileIds.length === 0) {
          console.log(`[AI-AUTO] Skipping criterion ${criterion.id} - no files`);
          continue;
        }

        // Check if this criterion has sub-criteria with evidence
        const hasSubCriteriaWithEvidence = criterion.subCriteria.some(sub => sub.evidence && sub.evidence.length > 0);
        console.log(`[AI-AUTO] Criterion ${criterion.id} has sub-criteria with evidence:`, hasSubCriteriaWithEvidence);
        
        if (!hasSubCriteriaWithEvidence) {
          console.log(`[AI-AUTO] Skipping criterion ${criterion.id} - no sub-criteria with evidence`);
          continue;
        }

        console.log(`[AI-AUTO] Running AI analysis for criterion ${criterion.id}...`);

        // Mark sub-criteria as loading
        const loadingScores: Record<string, { score: number; maxScore: number; loading: boolean }> = {};
        criterion.subCriteria.forEach(sub => {
          if (sub.evidence && sub.evidence.length > 0) {
            loadingScores[sub.id] = { score: 0, maxScore: sub.maxPoints, loading: true };
          }
        });
        setAiScores(prev => ({ ...prev, ...loadingScores }));

        try {
          // Use loaded student info (from state) or fallback to evaluation data
          const studentInfoForAI = studentInfo || (evaluation ? {
            studentCode: evaluation.studentCode,
            fullName: evaluation.studentName || evaluation.studentCode,
            className: evaluation.className
          } : undefined);
          
          console.log('[AI-AUTO] Student info for AI:', studentInfoForAI);
          
          const response = await getScoringsuggestion(
            {
              criteriaId: criterion.id,
              evidenceFileIds: fileIds,
              maxScore: criterion.maxPoints,
              subCriteria: criterion.subCriteria.map(sub => ({
                id: sub.id,
                name: sub.name,
                description: sub.description,
                maxPoints: sub.maxPoints
              })),
              studentInfo: studentInfoForAI
            },
            token
          );

          if (response.subCriteriaScores) {
            const newScores: Record<string, { score: number; maxScore: number }> = {};
            response.subCriteriaScores.forEach((subScore: any) => {
              newScores[subScore.subCriteriaId] = {
                score: subScore.suggestedScore,
                maxScore: subScore.maxScore
              };
            });
            setAiScores(prev => ({ ...prev, ...newScores }));
          }
        } catch (error: any) {
          console.error('AI Analysis error for criterion', criterion.id, ':', error);
          // Remove loading state on error
          const errorScores: Record<string, { score: number; maxScore: number }> = {};
          criterion.subCriteria.forEach(sub => {
            if (sub.evidence && sub.evidence.length > 0) {
              errorScores[sub.id] = { score: 0, maxScore: sub.maxPoints };
            }
          });
          setAiScores(prev => {
            const updated = { ...prev };
            Object.keys(errorScores).forEach(key => {
              delete updated[key];
            });
            return updated;
          });
        }
      }
    };

    // Small delay to ensure UI is ready
    const timer = setTimeout(() => {
      runAiAnalysis();
    }, 500);

    return () => clearTimeout(timer);
  }, [criteriaWithSubCriteria, criteriaFiles, evaluation, studentInfo]);
  const handleSubmit = async () => {
    if (!evaluationId) return;

    setSubmitting(true);
    try {
      const response = await submitEvaluation(evaluationId);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đánh giá đã được nộp để xét duyệt.",
        });
        setEvaluation(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể nộp đánh giá.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!evaluationId) return;

    setSubmitting(true);
    try {
      // Calculate scores from sub-criteria scores if available
      // If user has entered sub-criteria scores, calculate totals for each criterion
      const calculatedScores: Record<number, number> = {};
      
      // Determine which scores to use based on approver role
      const isClassMonitor = canApproveClassLevel(user) && evaluation?.status === 'SUBMITTED';
      const isAdvisor = canApproveAdvisorLevel(user) && evaluation?.status === 'CLASS_APPROVED';
      
      const scoresToCalculate = isClassMonitor ? classMonitorSubCriteriaScores : 
                                isAdvisor ? advisorSubCriteriaScores : {};
      
      if (Object.keys(scoresToCalculate).length > 0) {
        // Group sub-criteria scores by criterion
        criteriaWithSubCriteria.forEach(criterion => {
          const criterionSubScores: number[] = [];
          criterion.subCriteria.forEach(sub => {
            const subScoreKey = `${criterion.id}_${sub.id}`;
            const subScore = scoresToCalculate[subScoreKey];
            // Only include valid numeric scores
            if (subScore !== undefined && subScore !== null && !isNaN(subScore) && isFinite(subScore)) {
              criterionSubScores.push(subScore);
            }
          });
          
          // If at least one sub-criteria has a score, calculate total
          if (criterionSubScores.length > 0) {
            const total = criterionSubScores.reduce((sum, score) => {
              const numScore = Number(score);
              if (isNaN(numScore) || !isFinite(numScore)) {
                console.warn('[DEBUG] Invalid score found:', score);
                return sum;
              }
              return sum + numScore;
            }, 0);
            
            // Ensure total is a valid number
            if (!isNaN(total) && isFinite(total)) {
              // Get maxPoints, default to a large number if undefined
              const maxPoints = criterion.maxPoints !== undefined && criterion.maxPoints !== null 
                ? Number(criterion.maxPoints) 
                : Number.MAX_SAFE_INTEGER;
              
              calculatedScores[criterion.id] = Math.min(Math.max(0, total), maxPoints);
              console.log('[DEBUG] Calculated score for criterion:', {
                criterionId: criterion.id,
                total,
                maxPoints: criterion.maxPoints,
                finalScore: calculatedScores[criterion.id],
                approverType: isClassMonitor ? 'classMonitor' : isAdvisor ? 'advisor' : 'unknown'
              });
            } else {
              console.error('[DEBUG] Calculated total is invalid:', total, 'for criterion', criterion.id);
            }
          }
        });
      }
      
      // Debug log
      console.log('[DEBUG] Approval scores calculation:', {
        classMonitorSubCriteriaScores,
        advisorSubCriteriaScores,
        classMonitorKeys: Object.keys(classMonitorSubCriteriaScores),
        advisorKeys: Object.keys(advisorSubCriteriaScores),
        calculatedScores,
        approvalScores,
        finalScores: { ...approvalScores, ...calculatedScores },
        isClassMonitor,
        isAdvisor
      });
      
      // Merge calculated scores with manually entered approvalScores (from dialog, if any)
      // calculatedScores takes precedence as it's from the table
      // Clean up any NaN values from approvalScores first
      const cleanApprovalScores: Record<number, number> = {};
      Object.keys(approvalScores).forEach(key => {
        const score = approvalScores[Number(key)];
        if (score !== undefined && score !== null && !isNaN(score) && isFinite(score)) {
          cleanApprovalScores[Number(key)] = Number(score);
        }
      });
      
      const finalScores = { ...cleanApprovalScores, ...calculatedScores };
      
      // Final validation - remove any NaN values
      Object.keys(finalScores).forEach(key => {
        const score = finalScores[Number(key)];
        if (isNaN(score) || !isFinite(score)) {
          delete finalScores[Number(key)];
          console.warn('[DEBUG] Removed invalid score from finalScores:', key, score);
        }
      });
      
      // Prepare scores map (only include valid, non-zero scores)
      const scoresToSend = Object.keys(finalScores)
        .filter(key => {
          const score = finalScores[Number(key)];
          return score !== undefined && score !== null && !isNaN(score) && isFinite(score) && score > 0;
        })
        .reduce((acc, key) => {
          const score = finalScores[Number(key)];
          acc[Number(key)] = Number(score);
          return acc;
        }, {} as Record<number, number>);
      
      // Prepare subCriteriaScores to send (separate for class monitor and advisor)
      const subCriteriaScoresToSend = isClassMonitor ? classMonitorSubCriteriaScores : 
                                      isAdvisor ? advisorSubCriteriaScores : {};
      
      // Prepare score adjustments with full info (originalScore, newScore, reason, evidence)
      const scoreAdjustmentsToSend: Record<string, { originalScore: number; newScore: number; reason: string; evidence: string }> = {};
      Object.entries(scoreAdjustmentNotes).forEach(([key, note]) => {
        // key format: "role_criterionId_subCriteriaId" (e.g., "classMonitor_1_1.1")
        // Remove role prefix to get "criterionId_subCriteriaId"
        const parts = key.split('_');
        if (parts.length < 3) return; // Invalid key format
        
        const role = parts[0]; // "classMonitor" or "advisor"
        const criterionIdStr = parts[1]; // "1"
        const subCriteriaId = parts.slice(2).join('_'); // "1.1" (rejoin in case subCriteriaId contains _)
        
        // Only include adjustments for current role
        const currentRole = isClassMonitor ? 'classMonitor' : isAdvisor ? 'advisor' : null;
        if (role !== currentRole) return;
        
        const criterionId = Number(criterionIdStr);
        const keyWithoutRole = `${criterionId}_${subCriteriaId}`; // "1_1.1"
        
        // Find the criterion and sub-criteria
        const criterion = criteriaWithSubCriteria.find(c => c.id === criterionId);
        if (criterion) {
          const subCriteria = criterion.subCriteria.find(s => s.id === subCriteriaId);
          if (subCriteria) {
            const originalScore = subCriteria.score || 0;
            const newScore = subCriteriaScoresToSend[keyWithoutRole] || 0;
            
            scoreAdjustmentsToSend[keyWithoutRole] = {
              originalScore,
              newScore,
              reason: note.reason || '',
              evidence: note.evidence || '',
            };
          }
        }
      });
      
      console.log('[DEBUG] Scores to send to backend:', {
        scoresToSend,
        scoresToSendKeys: Object.keys(scoresToSend),
        subCriteriaScoresToSend,
        subCriteriaScoresToSendKeys: Object.keys(subCriteriaScoresToSend),
        subCriteriaScoresToSendCount: Object.keys(subCriteriaScoresToSend).length,
        scoreAdjustmentsToSend,
        scoreAdjustmentsCount: Object.keys(scoreAdjustmentsToSend).length,
        isClassMonitor,
        isAdvisor,
        evaluationId,
        approvalComment
      });
      
      const response = await approveEvaluation(
        evaluationId, 
        approvalComment || undefined,
        Object.keys(scoresToSend).length > 0 ? scoresToSend : undefined,
        Object.keys(subCriteriaScoresToSend).length > 0 ? subCriteriaScoresToSend : undefined,
        Object.keys(scoreAdjustmentsToSend).length > 0 ? scoreAdjustmentsToSend : undefined
      );
      
      console.log('[DEBUG] Approval response:', response);
      if (response.success) {
        // Clear localStorage after successful approval
        clearDraftScores();
        
        // Reload evaluation to ensure we have the latest status from database
        const reloadResponse = await getEvaluationById(evaluationId);
        if (reloadResponse.success && reloadResponse.data) {
          setEvaluation(reloadResponse.data);
        } else {
          // Fallback to response data if reload fails
          setEvaluation(response.data);
        }
        
        toast({
          title: "Thành công",
          description: "Đánh giá đã được duyệt. Bạn có thể xem lại ghi chú điều chỉnh bằng cách nhấn vào icon.",
        });
        setShowApproveDialog(false);
        setApprovalComment('');
        setApprovalScores({}); // Reset approval scores (criteria totals)
        // DON'T reset subCriteriaScores - keep them so they display correctly after approval
        // The scores will be reloaded from database when evaluation is reloaded
        // Stay on the page so user can view adjustment notes
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể duyệt đánh giá.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!evaluationId) return;

    setSubmitting(true);
    try {
      const response = await deleteEvaluation(evaluationId);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đánh giá đã được xóa.",
        });
        router.push('/evaluations');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa đánh giá. Chỉ có thể xóa đánh giá ở trạng thái Nháp.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReject = async () => {
    if (!evaluationId || !rejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await rejectEvaluation(evaluationId, rejectionReason);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đánh giá đã bị từ chối.",
        });
        setEvaluation(response.data);
        setShowRejectDialog(false);
        setRejectionReason('');
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể từ chối đánh giá.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!evaluation || !rubric) {
    return null;
  }

  const isOwner = user?.studentCode === evaluation.studentCode;
  const canApprove = user && (
    (evaluation.status === 'SUBMITTED' && canApproveClassLevel(user)) ||
    (evaluation.status === 'CLASS_APPROVED' && canApproveAdvisorLevel(user)) ||
    (evaluation.status === 'ADVISOR_APPROVED' && canApproveFacultyLevel(user))
  );
  const canSubmit = isOwner && evaluation.status === 'DRAFT';
  const canDelete = isOwner && evaluation.status === 'DRAFT';
  
  // Only owner can edit their own evaluation
  const canEdit = isOwner && (
    evaluation.status === 'DRAFT' || 
    evaluation.status === 'REJECTED' ||
    (canEditInPeriod && (evaluation.status === 'SUBMITTED' || evaluation.status === 'CLASS_APPROVED' || evaluation.status === 'FACULTY_APPROVED'))
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Chi tiết Đánh giá</h1>
              <p className="text-muted-foreground">
                {evaluation.semester} - {evaluation.academicYear || 'Năm học chưa xác định'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={evaluation.status} />
              <div className="flex items-center gap-2">
                {/* Debug: Log appeal button conditions */}
                {(() => {
                  console.log('[DEBUG] Appeal Button Conditions:', {
                    isOwner,
                    userStudentCode: user?.studentCode,
                    evaluationStudentCode: evaluation.studentCode,
                    evaluationStatus: evaluation.status,
                    isFacultyApproved: evaluation.status === 'FACULTY_APPROVED',
                    isRejected: evaluation.status === 'REJECTED',
                    shouldShowButton: isOwner && (evaluation.status === 'FACULTY_APPROVED' || evaluation.status === 'REJECTED'),
                    criteriaCount: criteria.length
                  });
                  return null;
                })()}
                
                {/* Appeal Button - Show for owner when evaluation is approved or rejected */}
                {isOwner && (evaluation.status === 'FACULTY_APPROVED' || evaluation.status === 'REJECTED') && (
                  <AppealButton
                    evaluationId={evaluation.id}
                    evaluationStatus={evaluation.status}
                    criteria={criteria.map(c => ({ id: c.id, name: c.name }))}
                    onAppealCreated={() => {
                      // Reload evaluation to show updated status
                      window.location.reload();
                    }}
                  />
                )}
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/evaluations/${evaluation.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {evaluation.status === 'REJECTED' ? 'Chỉnh sửa & Nộp lại' : 'Chỉnh sửa'}
                  </Button>
                )}
                {canDelete && (
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={submitting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Xác nhận xóa đánh giá</DialogTitle>
                        <DialogDescription>
                          Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                          Tất cả dữ liệu liên quan (điểm, bằng chứng, lịch sử) sẽ bị xóa vĩnh viễn.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang xóa...
                            </>
                          ) : (
                            'Xóa'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Đánh giá</CardTitle>
              <CardDescription>
                Rubric: {rubric.name} (Tối đa: {rubric.maxScore} điểm)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Mã sinh viên</Label>
                  <p className="text-sm font-medium">{evaluation.studentCode}</p>
                </div>
                <div>
                  <Label>Tổng điểm</Label>
                  <div className="text-sm font-medium">
                    <Badge variant="outline" className="text-lg">
                      {Math.round(evaluation.totalPoints || evaluation.totalScore || 0)} điểm
                      {evaluation.maxScore && ` / ${evaluation.maxScore}`}
                    </Badge>
                  </div>
                </div>
                {evaluation.submittedAt && (
                  <div>
                    <Label>Ngày nộp</Label>
                    <p className="text-sm">
                      {(() => {
                        // Try to get time from history if available
                        const submitHistory = evaluation.approvalHistory?.find(h => h.action === 'SUBMITTED');
                        if (submitHistory?.timestamp) {
                          return formatDate(submitHistory.timestamp);
                        }
                        // Fallback to submittedAt (date only)
                        return formatDate(evaluation.submittedAt);
                      })()}
                    </p>
                  </div>
                )}
                {evaluation.approvedAt && (
                  <div>
                    <Label>Ngày duyệt</Label>
                    <p className="text-sm">{formatDate(evaluation.approvedAt)}</p>
                  </div>
                )}
                {evaluation.isCreatedByAdmin && (
                  <div>
                    <Label>Người tạo</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Tạo bởi Admin
                      </Badge>
                      {evaluation.createdByName && (
                        <span className="text-sm text-muted-foreground">
                          ({evaluation.createdByName})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History Component - Moved here between info and criteria */}
          <EvaluationHistory 
            history={evaluation.approvalHistory || evaluation.history || []} 
            resubmissionCount={evaluation.resubmissionCount}
          />

          {/* Summary Card - Total scores for all criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng điểm các loại đánh giá</CardTitle>
              <CardDescription>
                Tổng hợp điểm từ tất cả các tiêu chí
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Điểm tối đa</Label>
                  <div className="text-2xl font-bold">
                    {rubric.maxScore}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Điểm tự chấm</Label>
                  <div className="text-2xl font-bold text-primary">
                    {(() => {
                      // Calculate total student score from all criteria
                      const total = criteriaWithSubCriteria.reduce((sum, criterion) => {
                        const criterionTotal = criterion.subCriteria.reduce((subSum, sub) => subSum + (sub.score ?? 0), 0);
                        return sum + criterionTotal;
                      }, 0);
                      return Math.round(total * 10) / 10;
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Điểm lớp trưởng</Label>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {(() => {
                      // Check if class monitor has scored based on evaluation status
                      // Class monitor scores when status >= CLASS_APPROVED
                      const hasClassMonitorScored = evaluation.status === 'CLASS_APPROVED' || 
                                                    evaluation.status === 'ADVISOR_APPROVED' || 
                                                    evaluation.status === 'FACULTY_APPROVED';
                      
                      if (!hasClassMonitorScored) {
                        return <span className="text-base text-muted-foreground">Chưa chấm</span>;
                      }
                      
                      // Calculate total class monitor score from all criteria
                      const total = criteriaWithSubCriteria.reduce((sum, criterion) => {
                        const stateTotal = criterion.subCriteria.reduce((subSum, sub) => {
                          const subScoreKey = `${criterion.id}_${sub.id}`;
                          const score = classMonitorSubCriteriaScores[subScoreKey];
                          return subSum + (score ?? 0);
                        }, 0);
                        // If state has scores, use them; otherwise use criterion score
                        const criterionTotal = stateTotal > 0 ? stateTotal : (criterion.classMonitorScore ?? 0);
                        return sum + criterionTotal;
                      }, 0);
                      return Math.round(total * 10) / 10;
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Điểm cố vấn</Label>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {(() => {
                      // Check if advisor has scored based on evaluation status
                      // Advisor scores when status >= ADVISOR_APPROVED
                      const hasAdvisorScored = evaluation.status === 'ADVISOR_APPROVED' || 
                                               evaluation.status === 'FACULTY_APPROVED';
                      
                      if (!hasAdvisorScored) {
                        return <span className="text-base text-muted-foreground">Chưa chấm</span>;
                      }
                      
                      // Calculate total advisor score from all criteria
                      const total = criteriaWithSubCriteria.reduce((sum, criterion) => {
                        const stateTotal = criterion.subCriteria.reduce((subSum, sub) => {
                          const subScoreKey = `${criterion.id}_${sub.id}`;
                          const score = advisorSubCriteriaScores[subScoreKey];
                          return subSum + (score ?? 0);
                        }, 0);
                        // If state has scores, use them; otherwise use criterion score
                        const criterionTotal = stateTotal > 0 ? stateTotal : (criterion.advisorScore ?? 0);
                        return sum + criterionTotal;
                      }, 0);
                      return Math.round(total * 10) / 10;
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiêu chí Đánh giá</CardTitle>
              <CardDescription>
                Tổng điểm: <strong>{Math.round(totalScore)} / {rubric.maxScore}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteriaWithSubCriteria.map((criterion, index) => (
                <div key={criterion.id} className="space-y-4 border rounded-lg p-4">
                  {/* Main Criteria Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        {index + 1}. {criterion.name}
                      </h4>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Tổng điểm tiêu chí:
                        </div>
                        <div className="text-lg font-bold">
                          {Math.round(criterion.totalScore)} / {criterion.maxPoints} điểm
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Scoring Suggestion - Show for criteria with evidence files */}
                  {/* AI Analysis Button - Hidden, will trigger from table */}

                  {/* Sub-Criteria Table */}
                  {criterion.subCriteria.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px] text-center">Mã</TableHead>
                            <TableHead className="min-w-[250px]">Tên tiêu chí</TableHead>
                            <TableHead className="w-[100px] text-center">Điểm tối đa</TableHead>
                            <TableHead className="w-[120px] text-center">Điểm tự chấm</TableHead>
                            <TableHead className="w-[130px] text-center">Điểm lớp trưởng</TableHead>
                            <TableHead className="w-[120px] text-center">Điểm cố vấn</TableHead>
                            <TableHead className="w-[200px] text-center">Bằng chứng</TableHead>
                            <TableHead className="w-[80px] text-center">AI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {criterion.subCriteria.map((sub) => {
                            // Calculate score distribution for sub-criteria (only for class monitor and advisor scores)
                            // Student score should come from evidence string, not distributed
                            const totalMaxPoints = criterion.subCriteria.reduce((sum, s) => sum + s.maxPoints, 0);
                            const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
                            
                            // Student score: use actual score from evidence string, not distributed
                            const studentSubScore = sub.score ?? 0; // Use actual score from evidence, not distributed
                            
                            // Calculate distributed scores for class monitor and advisor (they score at criteria level)
                            const classMonitorSubScore = criterion.classMonitorScore != null 
                              ? Math.round(criterion.classMonitorScore * ratio * 10) / 10 
                              : null;
                            const advisorSubScore = criterion.advisorScore != null 
                              ? Math.round(criterion.advisorScore * ratio * 10) / 10 
                              : null;
                            
                            // Determine which column to highlight based on evaluation status
                            const isClassMonitorScoring = evaluation.status === 'SUBMITTED' && canApproveClassLevel(user);
                            const isAdvisorScoring = evaluation.status === 'CLASS_APPROVED' && canApproveAdvisorLevel(user);
                            const isFacultyScoring = evaluation.status === 'ADVISOR_APPROVED' && canApproveFacultyLevel(user);
                            
                            // Debug log
                            if (sub.id === '1.1') {
                              console.log('[DEBUG] Scoring mode check:', {
                                evaluationStatus: evaluation.status,
                                userRoles: user?.roles,
                                canApproveClassLevel: canApproveClassLevel(user),
                                canApproveAdvisorLevel: canApproveAdvisorLevel(user),
                                isClassMonitorScoring,
                                isAdvisorScoring,
                                isFacultyScoring,
                              });
                            }
                            
                            // Get editable score for this sub-criteria (if user is editing)
                            // Use a key that includes criteriaId to avoid conflicts between different criteria
                            const subScoreKey = `${criterion.id}_${sub.id}`;
                            const editableClassMonitorScore = classMonitorSubCriteriaScores[subScoreKey];
                            const editableAdvisorScore = advisorSubCriteriaScores[subScoreKey];
                            
                            // Debug log for first sub-criteria
                            if (sub.id === '1.1') {
                              console.log('[DEBUG] Display calculation for sub 1.1:', {
                                subScoreKey,
                                editableClassMonitorScore,
                                classMonitorSubScore,
                                isClassMonitorScoring,
                                'classMonitorSubCriteriaScores': classMonitorSubCriteriaScores,
                                'criterion.classMonitorScore': criterion.classMonitorScore
                              });
                            }
                            
                            // Calculate displayed score: prioritize editable score from state
                            // If no score in state and not currently scoring, show "-" instead of distributed score
                            // Only show distributed score when actively scoring (for backward compatibility)
                            const displayedClassMonitorScore = editableClassMonitorScore !== undefined && editableClassMonitorScore !== null
                              ? editableClassMonitorScore
                              : (isClassMonitorScoring && classMonitorSubScore !== null && classMonitorSubScore !== undefined ? classMonitorSubScore : null);
                            const displayedAdvisorScore = editableAdvisorScore !== undefined && editableAdvisorScore !== null
                              ? editableAdvisorScore
                              : (isAdvisorScoring && advisorSubScore !== null && advisorSubScore !== undefined ? advisorSubScore : null);
                            
                            // Calculate total for criteria when sub-criteria scores change
                            // Separate handlers for class monitor and advisor
                            const handleClassMonitorScoreChange = (value: number) => {
                              console.log('[DEBUG] handleClassMonitorScoreChange called:', {
                                subScoreKey,
                                value,
                                criterionId: criterion.id,
                                subId: sub.id
                              });
                              
                              const newSubScores = { ...classMonitorSubCriteriaScores, [subScoreKey]: value };
                              setClassMonitorSubCriteriaScores(newSubScores);
                              
                              // Calculate total for this criterion by summing only sub-criteria scores that have been entered
                              const criterionSubScores: number[] = [];
                              criterion.subCriteria.forEach(s => {
                                const sKey = `${criterion.id}_${s.id}`;
                                const subScore = newSubScores[sKey];
                                // Only include scores that have been explicitly entered (not undefined/null)
                                if (subScore !== undefined && subScore !== null) {
                                  criterionSubScores.push(subScore);
                                }
                              });
                              
                              // Calculate total from entered scores only
                              const total = criterionSubScores.reduce((sum, score) => {
                                const numScore = Number(score);
                                if (isNaN(numScore) || !isFinite(numScore)) {
                                  console.warn('[DEBUG] Invalid score in calculation:', score);
                                  return sum;
                                }
                                return sum + numScore;
                              }, 0);
                              
                              // Ensure total is valid
                              const validTotal = isNaN(total) || !isFinite(total) ? 0 : total;
                              
                              // Get maxPoints, default to a large number if undefined
                              const maxPoints = criterion.maxPoints !== undefined && criterion.maxPoints !== null 
                                ? Number(criterion.maxPoints) 
                                : Number.MAX_SAFE_INTEGER;
                              
                              console.log('[DEBUG] Calculated total for criterion (class monitor):', {
                                criterionId: criterion.id,
                                criterionSubScores,
                                total: validTotal,
                                maxPoints: criterion.maxPoints,
                                finalScore: Math.min(Math.max(0, validTotal), maxPoints)
                              });
                              
                              setApprovalScores(prev => {
                                const finalScore = Math.min(Math.max(0, validTotal), maxPoints);
                                const updated = {
                                  ...prev,
                                  [criterion.id]: finalScore
                                };
                                console.log('[DEBUG] Updated approvalScores:', updated);
                                return updated;
                              });
                            };
                            
                            const handleAdvisorScoreChange = (value: number) => {
                              console.log('[DEBUG] handleAdvisorScoreChange called:', {
                                subScoreKey,
                                value,
                                criterionId: criterion.id,
                                subId: sub.id
                              });
                              
                              const newSubScores = { ...advisorSubCriteriaScores, [subScoreKey]: value };
                              setAdvisorSubCriteriaScores(newSubScores);
                              
                              // Calculate total for this criterion by summing only sub-criteria scores that have been entered
                              const criterionSubScores: number[] = [];
                              criterion.subCriteria.forEach(s => {
                                const sKey = `${criterion.id}_${s.id}`;
                                const subScore = newSubScores[sKey];
                                // Only include scores that have been explicitly entered (not undefined/null)
                                if (subScore !== undefined && subScore !== null) {
                                  criterionSubScores.push(subScore);
                                }
                              });
                              
                              // Calculate total from entered scores only
                              const total = criterionSubScores.reduce((sum, score) => {
                                const numScore = Number(score);
                                if (isNaN(numScore) || !isFinite(numScore)) {
                                  console.warn('[DEBUG] Invalid score in calculation:', score);
                                  return sum;
                                }
                                return sum + numScore;
                              }, 0);
                              
                              // Ensure total is valid
                              const validTotal = isNaN(total) || !isFinite(total) ? 0 : total;
                              
                              // Get maxPoints, default to a large number if undefined
                              const maxPoints = criterion.maxPoints !== undefined && criterion.maxPoints !== null 
                                ? Number(criterion.maxPoints) 
                                : Number.MAX_SAFE_INTEGER;
                              
                              console.log('[DEBUG] Calculated total for criterion (advisor):', {
                                criterionId: criterion.id,
                                criterionSubScores,
                                total: validTotal,
                                maxPoints: criterion.maxPoints,
                                finalScore: Math.min(Math.max(0, validTotal), maxPoints)
                              });
                              
                              setApprovalScores(prev => {
                                const finalScore = Math.min(Math.max(0, validTotal), maxPoints);
                                const updated = {
                                  ...prev,
                                  [criterion.id]: finalScore
                                };
                                console.log('[DEBUG] Updated approvalScores:', updated);
                                return updated;
                              });
                            };
                            
                            return (
                              <TableRow key={sub.id}>
                                <TableCell className="text-center font-medium text-muted-foreground">
                                  {sub.id}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{sub.name}</div>
                                  {sub.description && (
                                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                      {sub.description}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-medium">{sub.maxPoints}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-semibold ${isClassMonitorScoring || isAdvisorScoring || isFacultyScoring ? '' : 'text-primary'}`}>
                                    {sub.score ?? 0}
                                  </span>
                                </TableCell>
                                <TableCell className={`text-center ${isClassMonitorScoring ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                                  {isClassMonitorScoring ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={sub.maxPoints}
                                        step="0.1"
                                        value={displayedClassMonitorScore ?? 0}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          handleClassMonitorScoreChange(Math.min(Math.max(0, value), sub.maxPoints));
                                        }}
                                        onBlur={(e) => {
                                          const newScore = parseFloat(e.target.value) || 0;
                                          const key = `${criterion.id}_${sub.id}`;
                                          const originalScore = sub.score || 0;
                                          
                                          // Open dialog if score changed (regardless of note)
                                          if (newScore !== originalScore) {
                                            openAdjustmentDialog(criterion.id, sub, newScore);
                                          }
                                        }}
                                        className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
                                      />
                                      {hasAdjustmentNote(criterion.id, sub.id, 'classMonitor') && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                            >
                                              <MessageSquare className={`h-4 w-4 ${hasAdjustmentNote(criterion.id, sub.id, 'classMonitor') ? 'text-blue-600' : 'text-gray-400'}`} />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                              <h4 className="font-medium text-sm">Ghi chú điều chỉnh</h4>
                                              {hasAdjustmentNote(criterion.id, sub.id, 'classMonitor') ? (
                                                <div className="text-sm space-y-1">
                                                  <div>
                                                    <span className="font-medium">Lý do:</span>
                                                    <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'classMonitor')?.reason || 'Không có'}</p>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium">Minh chứng:</span>
                                                    <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'classMonitor')?.evidence || 'Không có'}</p>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="text-sm text-muted-foreground">Chưa có ghi chú</p>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => openAdjustmentDialog(criterion.id, sub, displayedClassMonitorScore || 0)}
                                              >
                                                {hasAdjustmentNote(criterion.id, sub.id, 'classMonitor') ? 'Chỉnh sửa' : 'Thêm ghi chú'}
                                              </Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                        {displayedClassMonitorScore !== null && displayedClassMonitorScore !== undefined ? displayedClassMonitorScore : 0}
                                      </span>
                                      {hasAdjustmentNote(criterion.id, sub.id, 'classMonitor') && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                            >
                                              <MessageSquare className="h-4 w-4 text-blue-600" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                              <h4 className="font-medium text-sm">Ghi chú điều chỉnh (Lớp trưởng)</h4>
                                              <div className="text-sm space-y-1">
                                                <div>
                                                  <span className="font-medium">Lý do:</span>
                                                  <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'classMonitor')?.reason || 'Không có'}</p>
                                                </div>
                                                <div>
                                                  <span className="font-medium">Minh chứng:</span>
                                                  <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'classMonitor')?.evidence || 'Không có'}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className={`text-center ${isAdvisorScoring ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                  {isAdvisorScoring ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={sub.maxPoints}
                                        step="0.1"
                                        value={displayedAdvisorScore ?? 0}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          handleAdvisorScoreChange(Math.min(Math.max(0, value), sub.maxPoints));
                                        }}
                                        onBlur={(e) => {
                                          const newScore = parseFloat(e.target.value) || 0;
                                          const key = `${criterion.id}_${sub.id}`;
                                          const originalScore = sub.score || 0;
                                          
                                          // Open dialog if score changed (regardless of note)
                                          if (newScore !== originalScore) {
                                            openAdjustmentDialog(criterion.id, sub, newScore);
                                          }
                                        }}
                                        className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
                                      />
                                      {hasAdjustmentNote(criterion.id, sub.id, 'advisor') && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                            >
                                              <MessageSquare className={`h-4 w-4 ${hasAdjustmentNote(criterion.id, sub.id, 'advisor') ? 'text-blue-600' : 'text-gray-400'}`} />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                              <h4 className="font-medium text-sm">Ghi chú điều chỉnh</h4>
                                              {hasAdjustmentNote(criterion.id, sub.id, 'advisor') ? (
                                                <div className="text-sm space-y-1">
                                                  <div>
                                                    <span className="font-medium">Lý do:</span>
                                                    <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'advisor')?.reason || 'Không có'}</p>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium">Minh chứng:</span>
                                                    <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'advisor')?.evidence || 'Không có'}</p>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="text-sm text-muted-foreground">Chưa có ghi chú</p>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => openAdjustmentDialog(criterion.id, sub, displayedAdvisorScore || 0)}
                                              >
                                                {hasAdjustmentNote(criterion.id, sub.id, 'advisor') ? 'Chỉnh sửa' : 'Thêm ghi chú'}
                                              </Button>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="font-semibold text-green-700 dark:text-green-400">
                                        {displayedAdvisorScore !== null && displayedAdvisorScore !== undefined ? displayedAdvisorScore : 0}
                                      </span>
                                      {hasAdjustmentNote(criterion.id, sub.id, 'advisor') && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                            >
                                              <MessageSquare className="h-4 w-4 text-blue-600" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                              <h4 className="font-medium text-sm">Ghi chú điều chỉnh (Cố vấn)</h4>
                                              <div className="text-sm space-y-1">
                                                <div>
                                                  <span className="font-medium">Lý do:</span>
                                                  <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'advisor')?.reason || 'Không có'}</p>
                                                </div>
                                                <div>
                                                  <span className="font-medium">Minh chứng:</span>
                                                  <p className="text-muted-foreground">{getAdjustmentNote(criterion.id, sub.id, 'advisor')?.evidence || 'Không có'}</p>
                                                </div>
                                              </div>
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {sub.evidence && sub.evidence.length > 0 ? (
                                    <div className="flex flex-col gap-1.5 items-center">
                                      {(() => {
                                        // Parse evidence string (comma-separated URLs) into array
                                        const fileUrls = sub.evidence.split(',').map(url => url.trim()).filter(Boolean);
                                        return fileUrls.slice(0, 3).map((url, idx) => (
                                          <a
                                            key={idx}
                                            href={`${API_BASE}${url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1.5 hover:text-primary/80 transition-colors"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            <span className="max-w-[150px] truncate">{getFileNameFromUrl(url)}</span>
                                          </a>
                                        ));
                                      })()}
                                      {(() => {
                                        const fileUrls = sub.evidence.split(',').map(url => url.trim()).filter(Boolean);
                                        return fileUrls.length > 3 ? (
                                          <span className="text-xs text-muted-foreground">
                                            +{fileUrls.length - 3} file
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground text-center block">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {/* AI Score column */}
                                  {(() => {
                                    const aiScore = aiScores[sub.id];
                                    if (aiScore) {
                                      if (aiScore.loading) {
                                        return <Loader2 className="h-4 w-4 animate-spin text-purple-600 mx-auto" />;
                                      }
                                      if (sub.evidence && sub.evidence.length > 0) {
                                        return (
                                          <div className="flex items-center justify-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                                              {aiScore.score}/{aiScore.maxScore}
                                            </span>
                                          </div>
                                        );
                                      }
                                    }
                                    return <span className="text-xs text-muted-foreground">-</span>;
                                  })()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={2} className="text-right font-semibold">
                              Tổng điểm tiêu chí:
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {criterion.maxPoints}
                            </TableCell>
                            <TableCell className="text-center font-bold text-primary">
                              {(() => {
                                // Calculate total student score from sub-criteria
                                const total = criterion.subCriteria.reduce((sum, sub) => sum + (sub.score ?? 0), 0);
                                return Math.round(total * 10) / 10;
                              })()}
                            </TableCell>
                            <TableCell className="text-center font-bold text-yellow-700 dark:text-yellow-400">
                              {(() => {
                                // Check if class monitor has scored based on evaluation status
                                const hasClassMonitorScored = evaluation.status === 'CLASS_APPROVED' || 
                                                              evaluation.status === 'ADVISOR_APPROVED' || 
                                                              evaluation.status === 'FACULTY_APPROVED';
                                
                                if (!hasClassMonitorScored) {
                                  return <span className="text-sm text-muted-foreground font-normal">Chưa chấm</span>;
                                }
                                
                                // Calculate total class monitor score from state or criterion
                                const stateTotal = criterion.subCriteria.reduce((sum, sub) => {
                                  const subScoreKey = `${criterion.id}_${sub.id}`;
                                  const score = classMonitorSubCriteriaScores[subScoreKey];
                                  return sum + (score ?? 0);
                                }, 0);
                                // If state has scores, use them; otherwise use criterion score
                                const total = stateTotal > 0 ? stateTotal : (criterion.classMonitorScore ?? 0);
                                return Math.round(total * 10) / 10;
                              })()}
                            </TableCell>
                            <TableCell className="text-center font-bold text-green-700 dark:text-green-400">
                              {(() => {
                                // Check if advisor has scored based on evaluation status
                                const hasAdvisorScored = evaluation.status === 'ADVISOR_APPROVED' || 
                                                         evaluation.status === 'FACULTY_APPROVED';
                                
                                if (!hasAdvisorScored) {
                                  return <span className="text-sm text-muted-foreground font-normal">Chưa chấm</span>;
                                }
                                
                                // Calculate total advisor score from state or criterion
                                const stateTotal = criterion.subCriteria.reduce((sum, sub) => {
                                  const subScoreKey = `${criterion.id}_${sub.id}`;
                                  const score = advisorSubCriteriaScores[subScoreKey];
                                  return sum + (score ?? 0);
                                }, 0);
                                // If state has scores, use them; otherwise use criterion score
                                const total = stateTotal > 0 ? stateTotal : (criterion.advisorScore ?? 0);
                                return Math.round(total * 10) / 10;
                              })()}
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  ) : (
                    // Fallback: If no sub-criteria, show simple format
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {criterion.description}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Điểm tự chấm</Label>
                          <p className="text-sm font-medium">
                            {Math.round(criterion.totalScore)} / {criterion.maxPoints} điểm
                          </p>
                        </div>
                        <div>
                          <Label>Bằng chứng</Label>
                          {(() => {
                            const detail = evaluation.details.find(d => d.criteriaId === criterion.id);
                            const evidence = detail?.evidence || '';
                            const fileUrls = evidence.match(/\/files\/evidence\/[^\s,]+/g) || [];
                            return fileUrls.length > 0 ? (
                              <div className="flex flex-col gap-1 mt-1">
                                {fileUrls.slice(0, 3).map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={`${API_BASE}${url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {getFileNameFromUrl(url)}
                                  </a>
                                ))}
                                {fileUrls.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{fileUrls.length - 3} file khác
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Không có</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            {canSubmit && (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    Nộp
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {canApprove && (
              <>
                  <Dialog open={showApproveDialog} onOpenChange={(open) => {
                  setShowApproveDialog(open);
                  if (!open) {
                    // Reset approval scores and comment when dialog closes
                    // But keep subCriteriaScores so they display correctly
                    setApprovalScores({});
                    // setSubCriteriaScores({}); // Keep sub-criteria scores for display
                    setApprovalComment('');
                    setAutoFilledScores(false); // Reset auto-fill flag
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <Check className="mr-2 h-4 w-4" />
                      Duyệt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Duyệt Đánh giá</DialogTitle>
                      <DialogDescription>
                        Xác nhận duyệt đánh giá này?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {autoFilledScores && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            {getAutoFillMessage(
                              canApproveClassLevel(user) && evaluation?.status === 'SUBMITTED'
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div>
                        <Label htmlFor="approval-comment">Ghi chú (tùy chọn)</Label>
                        <Textarea
                          id="approval-comment"
                          placeholder="Nhập ghi chú nếu có..."
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowApproveDialog(false);
                        setApprovalScores({});
                        // Don't reset subCriteriaScores when canceling - keep user's input
                        // setSubCriteriaScores({});
                        setApprovalComment('');
                        setAutoFilledScores(false); // Reset auto-fill flag
                      }}>
                        Hủy
                      </Button>
                      <Button onClick={handleApprove} disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang duyệt...
                          </>
                        ) : (
                          'Xác nhận Duyệt'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="mr-2 h-4 w-4" />
                      Từ chối
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Từ chối Đánh giá</DialogTitle>
                      <DialogDescription>
                        Vui lòng nhập lý do từ chối
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Nhập lý do từ chối..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Hủy
                      </Button>
                      <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectionReason.trim()}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang từ chối...
                          </>
                        ) : (
                          'Xác nhận Từ chối'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
      
      {/* Score Adjustment Dialog */}
      {currentAdjustment && (
        <ScoreAdjustmentDialog
          open={adjustmentDialogOpen}
          onOpenChange={setAdjustmentDialogOpen}
          criterionId={currentAdjustment.criterionId}
          subCriteriaId={currentAdjustment.subCriteria.id}
          subCriteriaName={currentAdjustment.subCriteria.name}
          originalScore={currentAdjustment.subCriteria.score}
          newScore={currentAdjustment.currentScore}
          existingReason={getAdjustmentNote(currentAdjustment.criterionId, currentAdjustment.subCriteria.id, currentUserRole || 'classMonitor')?.reason}
          existingEvidence={getAdjustmentNote(currentAdjustment.criterionId, currentAdjustment.subCriteria.id, currentUserRole || 'classMonitor')?.evidence}
          onSave={(reason, evidence) => {
            const role = currentUserRole || 'classMonitor';
            handleSaveAdjustmentNote(reason, evidence, role);
            setAdjustmentDialogOpen(false);
          }}
        />
      )}
    </ProtectedRoute>
  );
}
