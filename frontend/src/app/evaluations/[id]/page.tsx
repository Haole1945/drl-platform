"use client";

import { useEffect, useState, useMemo } from 'react';
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
import { getEvaluationById, submitEvaluation, approveEvaluation, rejectEvaluation, getActiveRubric, getCriteriaByRubric, deleteEvaluation } from '@/lib/evaluation';
import { StatusBadge } from '@/components/StatusBadge';
import { EvaluationHistory } from '@/components/EvaluationHistory';
import { canApproveClassLevel, canApproveAdvisorLevel, canApproveFacultyLevel } from '@/lib/role-utils';
import type { Evaluation, Rubric, Criteria, CriteriaWithSubCriteria,SubCriteria } from '@/types/evaluation';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Check, X, Edit, ExternalLink, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getOpenPeriod , getAuthToken} from '@/lib/api';
import { parseSubCriteria } from '@/lib/criteria-parser';
import { parseEvidence, getFileNameFromUrl } from '@/lib/evidence-parser';
import { formatDateTime, formatDate as formatDateUtil } from '@/lib/date-utils';
import { getScoringsuggestion } from '@/lib/api/ai-scoring';

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
  const [openPeriod, setOpenPeriod] = useState<any>(null);
  const [canEditInPeriod, setCanEditInPeriod] = useState(false);
  const [criteriaFiles, setCriteriaFiles] = useState<Record<number, number[]>>({}); // criteriaId -> fileIds[]
  const [aiScores, setAiScores] = useState<Record<string, { score: number; maxScore: number; loading?: boolean }>>({}); // subCriteriaId -> { score, maxScore }

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
        // If no evidenceData found, check if score exists in parsedEvidence (for scores without evidence)
        const score = evidenceData?.score ?? 
          (parsedEvidence.find(e => e.subCriteriaId === sub.id && e.score !== undefined)?.score ?? 0);
        // Convert fileUrls to string (comma-separated URLs)
        const evidenceString = (evidenceData?.fileUrls || []).join(', ');
        return {
          ...sub,
          score: score, // Use score from parsed evidence
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
        classMonitorScore: classMonitorScore,
        advisorScore: advisorScore,
        finalScore: finalScore, // Score to display (advisor > class monitor > student)
      };
    });
  }, [criteria, evaluation]);

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
            // Only initialize if state is empty (first load), don't override user's entered scores
            const initialClassMonitorScores: Record<string, number> = {};
            const initialAdvisorScores: Record<string, number> = {};
            
            // Only load from database if state is empty (not already entered by user)
            if (Object.keys(classMonitorSubCriteriaScores).length === 0 && 
                Object.keys(advisorSubCriteriaScores).length === 0 && 
                evalData.details) {
              evalData.details.forEach(detail => {
                // Find the criterion
                const criterion = criteriaResponse.data.find((c: Criteria) => c.id === detail.criteriaId);
                if (criterion && criterion.subCriteria) {
                  // Try to parse sub-criteria scores from comment (JSON format)
                  // Note: comment is mapped to both note and evidence in DTO
                  // note contains the raw comment, evidence may have prefix removed
                  let parsedSubCriteriaScores: any = null;
                  // Use note first (raw comment), fallback to evidence
                  const commentText = detail.note || detail.evidence;
                  
                  console.log('[DEBUG] Loading scores for criteria', detail.criteriaId, {
                    note: detail.note,
                    evidence: detail.evidence,
                    commentText: commentText?.substring(0, 100) + (commentText && commentText.length > 100 ? '...' : ''),
                    commentTextIsJSON: commentText?.trim().startsWith('{'),
                    classMonitorScore: detail.classMonitorScore,
                    advisorScore: detail.advisorScore
                  });
                  
                  if (commentText && commentText.trim().startsWith('{')) {
                    // It's JSON, parse it
                    try {
                      const parsed = JSON.parse(commentText);
                      console.log('[DEBUG] Parsed JSON from comment:', parsed);
                      if (parsed.scores) {
                        parsedSubCriteriaScores = parsed.scores;
                        console.log('[DEBUG] Found subCriteriaScores in JSON:', parsedSubCriteriaScores);
                      } else {
                        console.log('[DEBUG] No scores field in JSON, keys:', Object.keys(parsed));
                      }
                    } catch (e) {
                      // JSON parse failed
                      console.error('[DEBUG] Failed to parse JSON comment:', e.message);
                    }
                  } else if (commentText) {
                    // Not JSON (evidence string), will fallback to distribution
                    console.log('[DEBUG] Comment is not JSON (evidence string), will use fallback distribution');
                  } else {
                    console.log('[DEBUG] No comment text found for criteria', detail.criteriaId);
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
                    const totalMaxPoints = criterion.subCriteria.reduce((sum: number, s: any) => sum + s.maxPoints, 0);
                    // If class monitor score exists, distribute it
                    if (detail.classMonitorScore != null) {
                      criterion.subCriteria.forEach((sub: any) => {
                        const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
                        const distributedScore = Math.round(detail.classMonitorScore * ratio * 10) / 10;
                        const subScoreKey = `${detail.criteriaId}_${sub.id}`;
                        initialClassMonitorScores[subScoreKey] = distributedScore;
                      });
                    }
                    // If advisor score exists, distribute it separately
                    if (detail.advisorScore != null) {
                      criterion.subCriteria.forEach((sub: any) => {
                        const ratio = totalMaxPoints > 0 ? sub.maxPoints / totalMaxPoints : 0;
                        const distributedScore = Math.round(detail.advisorScore * ratio * 10) / 10;
                        const subScoreKey = `${detail.criteriaId}_${sub.id}`;
                        initialAdvisorScores[subScoreKey] = distributedScore;
                      });
                    }
                  }
                }
              });
              
              if (Object.keys(initialClassMonitorScores).length > 0) {
                setClassMonitorSubCriteriaScores(initialClassMonitorScores);
              }
              if (Object.keys(initialAdvisorScores).length > 0) {
                setAdvisorSubCriteriaScores(initialAdvisorScores);
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
                      },
                    });
                    
                    if (syncResponse.ok) {
                      console.log('[AI Debug] Files synced successfully, fetching again');
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
                                  console.log('[AI Debug] Found file IDs after sync:', fileIds);
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
      if (evaluation && (evaluation.status === 'SUBMITTED' || evaluation.status === 'CLASS_APPROVED' || evaluation.status === 'FACULTY_APPROVED')) {
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

  // Auto-run AI analysis when files are loaded
  useEffect(() => {
    const runAiAnalysis = async () => {
      if (!criteriaWithSubCriteria.length || !Object.keys(criteriaFiles).length || !evaluation) {
        return;
      }

      const token = getAuthToken();
      if (!token) {
        return;
      }

      // Run AI analysis for each criterion that has files
      for (const criterion of criteriaWithSubCriteria) {
        const fileIds = criteriaFiles[criterion.id] || [];
        if (fileIds.length === 0) {
          continue;
        }

        // Check if this criterion has sub-criteria with evidence
        const hasSubCriteriaWithEvidence = criterion.subCriteria.some(sub => sub.evidence && sub.evidence.length > 0);
        if (!hasSubCriteriaWithEvidence) {
          continue;
        }

        // Mark sub-criteria as loading
        const loadingScores: Record<string, { score: number; maxScore: number; loading: boolean }> = {};
        criterion.subCriteria.forEach(sub => {
          if (sub.evidence && sub.evidence.length > 0) {
            loadingScores[sub.id] = { score: 0, maxScore: sub.maxPoints, loading: true };
          }
        });
        setAiScores(prev => ({ ...prev, ...loadingScores }));

        try {
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
              }))
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
  }, [criteriaWithSubCriteria, criteriaFiles, evaluation]);

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
      const isClassMonitor = canApproveClassLevel(user) && evaluation.status === 'SUBMITTED';
      const isAdvisor = canApproveAdvisorLevel(user) && evaluation.status === 'CLASS_APPROVED';
      
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
      
      console.log('[DEBUG] Scores to send to backend:', {
        scoresToSend,
        scoresToSendKeys: Object.keys(scoresToSend),
        subCriteriaScoresToSend,
        subCriteriaScoresToSendKeys: Object.keys(subCriteriaScoresToSend),
        subCriteriaScoresToSendCount: Object.keys(subCriteriaScoresToSend).length,
        isClassMonitor,
        isAdvisor,
        evaluationId,
        approvalComment
      });
      
      const response = await approveEvaluation(
        evaluationId, 
        approvalComment || undefined,
        Object.keys(scoresToSend).length > 0 ? scoresToSend : undefined,
        Object.keys(subCriteriaScoresToSend).length > 0 ? subCriteriaScoresToSend : undefined
      );
      
      console.log('[DEBUG] Approval response:', response);
      if (response.success) {
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
          description: "Đánh giá đã được duyệt.",
        });
        setShowApproveDialog(false);
        setApprovalComment('');
        setApprovalScores({}); // Reset approval scores (criteria totals)
        // DON'T reset subCriteriaScores - keep them so they display correctly after approval
        // The scores will be reloaded from database when evaluation is reloaded
        // Redirect to approvals page after successful approval
        setTimeout(() => {
          router.push('/approvals');
        }, 1000);
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
                            
                            // Get editable score for this sub-criteria (if user is editing)
                            // Use a key that includes criteriaId to avoid conflicts between different criteria
                            const subScoreKey = `${criterion.id}_${sub.id}`;
                            const editableClassMonitorScore = classMonitorSubCriteriaScores[subScoreKey];
                            const editableAdvisorScore = advisorSubCriteriaScores[subScoreKey];
                            
                            // Calculate displayed score: always prioritize editable score if exists, else use distributed score
                            // This ensures user-entered scores are always shown, even after approval
                            // Default to 0 if no score is entered
                            const displayedClassMonitorScore = editableClassMonitorScore !== undefined && editableClassMonitorScore !== null
                              ? editableClassMonitorScore
                              : (classMonitorSubScore !== null && classMonitorSubScore !== undefined ? classMonitorSubScore : 0);
                            const displayedAdvisorScore = editableAdvisorScore !== undefined && editableAdvisorScore !== null
                              ? editableAdvisorScore
                              : (advisorSubScore !== null && advisorSubScore !== undefined ? advisorSubScore : 0);
                            
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
                                      className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
                                    />
                                  ) : (
                                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                      {displayedClassMonitorScore ?? 0}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className={`text-center ${isAdvisorScoring ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                  {isAdvisorScoring ? (
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
                                      className="w-20 h-8 text-center text-sm font-semibold bg-white dark:bg-gray-800"
                                    />
                                  ) : (
                                    <span className="font-semibold text-green-700 dark:text-green-400">
                                      {displayedAdvisorScore ?? 0}
                                    </span>
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
                                            <CheckCircle2 className="h-4 w-4 text-green-600" title="Evidence verified" />
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
    </ProtectedRoute>
  );
}
