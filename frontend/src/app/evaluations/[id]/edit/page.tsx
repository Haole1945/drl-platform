"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getEvaluationById, updateEvaluation, getCriteriaByRubric } from '@/lib/evaluation';
import type { Evaluation, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';
import { parseSubCriteria, calculateCriteriaTotal } from '@/lib/criteria-parser';
import { parseEvidence } from '@/lib/evidence-parser';
import { FileUpload, type UploadedFile } from '@/components/FileUpload';
import { Loader2, Save } from 'lucide-react';

export default function EditEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State for sub-criteria scores: criteriaId -> subCriteriaId -> score
  const [subCriteriaScores, setSubCriteriaScores] = useState<Record<number, Record<string, number>>>({});
  // State for uploaded files: criteriaId -> subCriteriaId -> files[]
  const [subCriteriaFiles, setSubCriteriaFiles] = useState<Record<number, Record<string, UploadedFile[]>>>({});

  const evaluationId = params?.id ? parseInt(params.id as string) : null;

  // Initialize scores and files from evaluation when it loads
  // Force re-initialize when evaluation changes (including after update)
  useEffect(() => {
    if (!evaluation || !criteria.length || !evaluation.details) {
      // Reset states when evaluation is cleared
      setSubCriteriaScores({});
      setSubCriteriaFiles({});
      return;
    }

    criteria.forEach(criterion => {
      const detail = evaluation.details.find(d => d.criteriaId === criterion.id);
      if (!detail) {
        return;
      }

      // Parse evidence to get sub-criteria files and scores
      const parsedEvidence = detail.evidence ? parseEvidence(detail.evidence) : [];
      
      // Initialize scores from existing detail
      const scores: Record<string, number> = {};
      parsedEvidence.forEach(evidence => {
        if (evidence.subCriteriaId && evidence.score !== undefined) {
          scores[evidence.subCriteriaId] = evidence.score;
        }
      });
      // If no scores found in evidence, try to distribute total score equally
      if (Object.keys(scores).length === 0) {
        const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
        if (subCriteria.length > 0) {
          const totalScore = detail.score || detail.selfScore || 0;
          const scorePerSub = totalScore / subCriteria.length;
          subCriteria.forEach(sub => {
            scores[sub.id] = scorePerSub;
          });
        }
      }
      // Update scores state
      if (Object.keys(scores).length > 0) {
        setSubCriteriaScores(prev => {
          if (prev[criterion.id]) {
            return prev; // Don't overwrite user changes
          }
          return {
            ...prev,
            [criterion.id]: scores
          };
        });
      }

      // Initialize files from existing evidence
      if (parsedEvidence.length > 0) {
        const files: Record<string, UploadedFile[]> = {};
        parsedEvidence.forEach(evidence => {
          if (evidence.subCriteriaId && evidence.fileUrls && evidence.fileUrls.length > 0) {
            files[evidence.subCriteriaId] = evidence.fileUrls.map((url, index) => {
              // Normalize fileUrl - ensure it's a relative path starting with /files/evidence/
              let normalizedUrl = url;
              if (url.startsWith('http://') || url.startsWith('https://')) {
                try {
                  const urlObj = new URL(url);
                  normalizedUrl = urlObj.pathname;
                } catch (e) {
                  const match = url.match(/\/files\/evidence\/.+/);
                  if (match) normalizedUrl = match[0];
                }
              }
              // Ensure it starts with /files/evidence/
              if (normalizedUrl && !normalizedUrl.startsWith('/files/evidence/')) {
                if (normalizedUrl.startsWith('/files/')) {
                  // Already has /files/, might be correct
                } else if (normalizedUrl.includes('/evidence/')) {
                  normalizedUrl = '/files' + (normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl);
                }
              }
              return {
                id: Date.now() + index + Math.random(),
                fileUrl: normalizedUrl,
                fileName: normalizedUrl.split('/').pop() || 'file',
                fileSize: 0,
                fileType: 'application/octet-stream',
              };
            });
          }
        });

        // Update files state - merge with existing to preserve user uploads
        setSubCriteriaFiles(prev => {
          const existingFiles = prev[criterion.id] || {};
          
          // Only update if we have new files or files changed
          const hasChanges = Object.keys(files).length > 0 && 
            Object.keys(files).some(subId => {
              const existing = existingFiles[subId] || [];
              const newFiles = files[subId] || [];
              if (existing.length !== newFiles.length) {
                return true;
              }
              const existingUrls = existing.map(f => f.fileUrl).sort().join(',');
              const newUrls = newFiles.map(f => f.fileUrl).sort().join(',');
              if (existingUrls !== newUrls) {
                return true;
              }
              return false;
            });
          
          if (hasChanges) {
            return {
              ...prev,
              [criterion.id]: {
                ...existingFiles,
                ...files // Merge: new files override existing, but keep user uploads
              }
            };
          }
          return prev;
        });
      }
    });
  }, [evaluation, criteria]); // Only depend on evaluation and criteria

  // Parse criteria to include sub-criteria and map with evaluation details
  const criteriaWithSubCriteria = useMemo<CriteriaWithSubCriteria[]>(() => {
    if (!criteria.length || !evaluation || !evaluation.details) return [];

    return criteria.map(criterion => {
      const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
      const detail = evaluation.details.find(d => d.criteriaId === criterion.id);
      
      // Parse evidence to get sub-criteria files
      const parsedEvidence = detail?.evidence ? parseEvidence(detail.evidence) : [];
      
      // Map sub-criteria with scores and files
      const subCriteriaWithData = subCriteria.map((sub, subIndex) => {
        const evidenceData = parsedEvidence.find(e => e.subCriteriaId === sub.id);
        // Get files from state (which is initialized from evidence)
        const filesFromState = subCriteriaFiles[criterion.id]?.[sub.id] || [];
        return {
          ...sub,
          score: subCriteriaScores[criterion.id]?.[sub.id] || 0,
          evidence: filesFromState.map(f => ({ url: f.fileUrl })), // Convert to display format
        };
      });

      const scores = subCriteriaScores[criterion.id] || {};
      const totalScore = calculateCriteriaTotal(subCriteria, scores);
      
      return {
        ...criterion,
        subCriteria: subCriteriaWithData,
        totalScore,
      };
    });
  }, [criteria, evaluation, subCriteriaScores, subCriteriaFiles]);

  // Calculate total score
  const totalScore = useMemo(() => {
    return criteriaWithSubCriteria.reduce((sum, c) => sum + c.totalScore, 0);
  }, [criteriaWithSubCriteria]);

  useEffect(() => {
    if (!evaluationId) {
      router.push('/evaluations');
      return;
    }

    let isMounted = true;

    const loadEvaluation = async () => {
      try {
        const response = await getEvaluationById(evaluationId);
        if (!isMounted) return;
        
        if (response.success && response.data) {
          const evaluationData = response.data;
          
          // Check if user can edit
          if (evaluationData.studentCode !== user?.studentCode) {
            toast({
              title: "Lỗi",
              description: "Bạn không có quyền chỉnh sửa đánh giá này.",
              variant: "destructive"
            });
            router.push(`/evaluations/${evaluationId}`);
            return;
          }

          if (evaluationData.status !== 'DRAFT' && evaluationData.status !== 'REJECTED') {
            toast({
              title: "Lỗi",
              description: "Chỉ có thể chỉnh sửa đánh giá ở trạng thái Nháp hoặc Bị từ chối.",
              variant: "destructive"
            });
            router.push(`/evaluations/${evaluationId}`);
            return;
          }

          setEvaluation(evaluationData);

          // Load criteria
          if (evaluationData.rubricId) {
            const criteriaResponse = await getCriteriaByRubric(evaluationData.rubricId);
            if (!isMounted) return;
            
            if (criteriaResponse.success && criteriaResponse.data) {
              setCriteria(criteriaResponse.data);
            }
          }
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy đánh giá.",
            variant: "destructive"
          });
          router.push('/evaluations');
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        // If we reach here, it means all retries failed - this is a real error
        // Retry logic in API client handles transient errors automatically
        toast({
          title: "Lỗi",
          description: "Không thể tải đánh giá.",
          variant: "destructive"
        });
        router.push('/evaluations');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvaluation();
    
    return () => {
      isMounted = false;
    };
  }, [evaluationId]); // Remove user, router, toast from dependencies to prevent re-renders

  const handleSubCriteriaScoreChange = (criteriaId: number, subCriteriaId: string, score: number) => {
    setSubCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: score
      }
    }));
  };

  const handleSave = async () => {
    if (!evaluationId) return;

    setSubmitting(true);
    try {
      // Convert sub-criteria scores to evaluation details format
      const details = criteriaWithSubCriteria.map(criterion => {
        // Build evidence string with scores and files
        // Format: "SCORES:1.1=3,1.2=10|EVIDENCE:1.1. Name: /files/... 1.2. Name: /files/..."
        // Include all scores (including 0) to ensure all sub-criteria scores are saved
        const scores = criterion.subCriteria
          .map(sub => {
            const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
            return `${sub.id}=${score}`;
          })
          .join(',');
        
        const subEvidence = criterion.subCriteria
          .map(sub => {
            const files = subCriteriaFiles[criterion.id]?.[sub.id] || [];
            // Ensure fileUrl is properly formatted (should be relative path like /files/evidence/...)
            const fileUrls = files
              .map(f => {
                // If fileUrl already starts with /files/, use it directly
                // Otherwise, it might be a full URL, extract the path
                let url = f.fileUrl || '';
                if (!url) return '';
                
                // If it's a full URL, extract the path
                if (url.startsWith('http://') || url.startsWith('https://')) {
                  try {
                    const urlObj = new URL(url);
                    url = urlObj.pathname;
                  } catch (e) {
                    // If URL parsing fails, try to extract path manually
                    const match = url.match(/\/files\/evidence\/.+/);
                    if (match) url = match[0];
                  }
                }
                
                // Ensure it starts with /files/evidence/
                if (url && !url.startsWith('/files/evidence/')) {
                  // Try to fix if it's missing the prefix
                  if (url.startsWith('/files/')) {
                    // Already has /files/, might be correct - check if it has /evidence/
                    if (!url.includes('/evidence/')) {
                      // Missing /evidence/ part, might need to add it
                      // But this shouldn't happen if backend returns correct format
                      console.warn('File URL missing /evidence/ part:', url);
                    }
                  } else if (url.includes('/evidence/')) {
                    // Has evidence but missing /files prefix
                    url = '/files' + (url.startsWith('/') ? url : '/' + url);
                  } else {
                    // Doesn't look like a valid file URL
                    console.warn('Invalid file URL format:', url);
                    return '';
                  }
                }
                return url;
              })
              .filter(url => url && url.startsWith('/files/evidence/'))
              .join(', ');
            return fileUrls ? `${sub.id}. ${sub.name}: ${fileUrls}` : '';
          })
          .filter(e => e)
          .join('\n');
        
        // Combine scores and evidence
        const combinedEvidence = scores ? `SCORES:${scores}|EVIDENCE:${subEvidence}` : `EVIDENCE:${subEvidence}`;

        return {
          criteriaId: criterion.id,
          score: criterion.totalScore, // Total of all sub-criteria
          evidence: combinedEvidence,
          note: '',
        };
      });

      console.log('[DEBUG EDIT] ===== PAYLOAD BEFORE SEND =====');
      console.log('[DEBUG EDIT] Evaluation ID:', evaluationId);
      console.log('[DEBUG EDIT] Details count:', details.length);
      details.forEach((detail, idx) => {
        console.log(`[DEBUG EDIT] Detail ${idx + 1}:`, {
          criteriaId: detail.criteriaId,
          score: detail.score,
          evidence: detail.evidence?.substring(0, 300) + (detail.evidence?.length > 300 ? '...' : ''),
          evidenceLength: detail.evidence?.length || 0
        });
      });
      console.log('[DEBUG EDIT] =============================');

      const response = await updateEvaluation(evaluationId, {
        details: details as any
      });

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đánh giá đã được cập nhật.",
        });
        
        // Redirect to detail page after successful update
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push(`/evaluations/${evaluationId}`);
      }
    } catch (error: any) {
      // If we reach here, it means all retries failed - this is a real error
      // Retry logic in API client handles transient errors automatically
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật đánh giá.",
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

  if (!evaluation || criteria.length === 0) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Chỉnh sửa Đánh giá</h1>
            <p className="text-muted-foreground">
              {evaluation.semester} - {evaluation.academicYear || 'Năm học chưa xác định'}
            </p>
          </div>

          {evaluation.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Lý do Từ chối</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {evaluation.rejectionReason}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tiêu chí Đánh giá</CardTitle>
              <CardDescription>
                Tổng điểm hiện tại: <strong>{totalScore} / {evaluation.maxScore || 'N/A'}</strong>
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
                          {criterion.totalScore} / {criterion.maxPoints} điểm
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Criteria Table */}
                  {criterion.subCriteria.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div className="col-span-1">Mã</div>
                        <div className="col-span-5">Tên tiêu chí</div>
                        <div className="col-span-2 text-center">Điểm tối đa</div>
                        <div className="col-span-2 text-center">Điểm tự chấm</div>
                        <div className="col-span-2 text-center">
                          <div>Bằng chứng</div>
                          <div className="text-xs font-normal text-muted-foreground mt-0.5">
                            (tối đa 10 file, 50MB/file)
                          </div>
                        </div>
                      </div>
                      
                      {criterion.subCriteria.map((sub) => {
                        const currentScore = subCriteriaScores[criterion.id]?.[sub.id] || 0;
                        
                        return (
                          <div key={sub.id} className="grid grid-cols-12 gap-2 items-start border-b pb-2 last:border-0">
                            <div className="col-span-1 text-sm font-medium">{sub.id}</div>
                            <div className="col-span-5">
                              <div className="text-sm font-medium">{sub.name}</div>
                              {sub.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {sub.description}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 text-center text-sm">
                              {sub.maxPoints} điểm
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <Input
                                type="number"
                                min={sub.maxPoints < 0 ? -Math.abs(sub.maxPoints) : 0}
                                max={sub.maxPoints}
                                step="1"
                                value={currentScore}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  // Clamp value: allow negative if maxPoints suggests it
                                  const clamped = sub.maxPoints < 0 
                                    ? Math.max(-Math.abs(sub.maxPoints), Math.min(val, Math.abs(sub.maxPoints)))
                                    : Math.max(0, Math.min(val, sub.maxPoints));
                                  handleSubCriteriaScoreChange(criterion.id, sub.id, clamped);
                                }}
                                className="text-center w-20 h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2 flex justify-center items-center">
                              <FileUpload
                                evaluationId={evaluationId}
                                criteriaId={criterion.id}
                                subCriteriaId={sub.id}
                                onFilesChange={(files) => {
                                  setSubCriteriaFiles(prev => ({
                                    ...prev,
                                    [criterion.id]: {
                                      ...(prev[criterion.id] || {}),
                                      [sub.id]: files,
                                    },
                                  }));
                                }}
                                existingFiles={subCriteriaFiles[criterion.id]?.[sub.id] || []}
                                maxFiles={10}
                                maxSizeMB={50}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Fallback: If no sub-criteria parsed, show old format
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {criterion.description}
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Điểm tự chấm (0 - {criterion.maxPoints})</Label>
                          <Input
                            type="number"
                            min="0"
                            max={criterion.maxPoints}
                            step="1"
                            value={criterion.totalScore}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              handleSubCriteriaScoreChange(criterion.id, 'main', val);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Bằng chứng / Minh chứng</Label>
                          <FileUpload
                            evaluationId={evaluationId}
                            criteriaId={criterion.id}
                            onFilesChange={(files) => {
                              setSubCriteriaFiles(prev => ({
                                ...prev,
                                [criterion.id]: {
                                  ...(prev[criterion.id] || {}),
                                  'main': files,
                                },
                              }));
                            }}
                            existingFiles={subCriteriaFiles[criterion.id]?.['main'] || []}
                            maxFiles={10}
                            maxSizeMB={50}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push(`/evaluations/${evaluationId}`)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu Thay đổi
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
