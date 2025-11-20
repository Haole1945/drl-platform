"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getActiveRubric, getCriteriaByRubric, createEvaluation, submitEvaluation } from '@/lib/evaluation';
import { canCreateEvaluation } from '@/lib/role-utils';
import type { Rubric, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';
import { parseSubCriteria, calculateCriteriaTotal } from '@/lib/criteria-parser';
import { FileUpload, type UploadedFile } from '@/components/FileUpload';
import { Loader2, AlertCircle } from 'lucide-react';
import { getOpenPeriod } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NewEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [semester, setSemester] = useState('');
  const [openPeriod, setOpenPeriod] = useState<any>(null);
  const [checkingPeriod, setCheckingPeriod] = useState(true);
  
  // State for sub-criteria scores: criteriaId -> subCriteriaId -> score
  const [subCriteriaScores, setSubCriteriaScores] = useState<Record<number, Record<string, number>>>({});
  // State for sub-criteria evidence: criteriaId -> subCriteriaId -> evidence
  const [subCriteriaEvidence, setSubCriteriaEvidence] = useState<Record<number, Record<string, string>>>({});
  // State for uploaded files: criteriaId -> subCriteriaId -> files[]
  const [subCriteriaFiles, setSubCriteriaFiles] = useState<Record<number, Record<string, UploadedFile[]>>>({});

  // Parse criteria to include sub-criteria
  const criteriaWithSubCriteria = useMemo<CriteriaWithSubCriteria[]>(() => {
    return criteria.map(criterion => {
      const subCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
      const scores = subCriteriaScores[criterion.id] || {};
      const totalScore = calculateCriteriaTotal(subCriteria, scores);
      
      return {
        ...criterion,
        subCriteria,
        totalScore,
      };
    });
  }, [criteria, subCriteriaScores]);

  // Calculate total score across all criteria
  const totalScore = useMemo(() => {
    return criteriaWithSubCriteria.reduce((sum, c) => sum + c.totalScore, 0);
  }, [criteriaWithSubCriteria]);

  useEffect(() => {
    if (!user || !canCreateEvaluation(user)) {
      router.push('/dashboard');
      return;
    }

    const loadData = async () => {
      try {
        // Check for open period first
        setCheckingPeriod(true);
        try {
          const periodResponse = await getOpenPeriod();
          // If success and has data, set it. If success but no data, that's OK (no period open)
          if (periodResponse.success) {
            if (periodResponse.data) {
              setOpenPeriod(periodResponse.data);
            }
            // If no data, periodResponse.data will be null/undefined, which is fine
          }
        } catch (error) {
          // Silently handle period check failure - it's not critical
          // Continue loading rubric even if period check fails
          // Don't set openPeriod, so it will show "no period" message
        } finally {
          setCheckingPeriod(false);
        }
        
        // Load rubric
        const rubricResponse = await getActiveRubric();
        if (rubricResponse.success && rubricResponse.data) {
          setRubric(rubricResponse.data);
          
          const criteriaResponse = await getCriteriaByRubric(rubricResponse.data.id);
          if (criteriaResponse.success && criteriaResponse.data) {
            setCriteria(criteriaResponse.data);
            // Initialize empty scores
            const initialScores: Record<number, Record<string, number>> = {};
            criteriaResponse.data.forEach(c => {
              initialScores[c.id] = {};
            });
            setSubCriteriaScores(initialScores);
          }
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy rubric đang active. Vui lòng liên hệ quản trị viên.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        // If we reach here, it means all retries failed - this is a real error
        // Retry logic in API client handles transient errors automatically
        // If retry succeeds, we never reach this catch block
        let errorMessage = "Không thể tải rubric. Vui lòng thử lại.";
        
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('kết nối')) {
          errorMessage = "Không thể kết nối đến server. Vui lòng đảm bảo backend services đang chạy và bạn đã đăng nhập.";
        } else if (error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.message?.includes('authorization')) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router, toast]);

  const handleSubCriteriaScoreChange = (criteriaId: number, subCriteriaId: string, score: number) => {
    // Only allow integers
    const intScore = Math.round(score);
    
    setSubCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: intScore,
      },
    }));
  };

  const handleSubCriteriaEvidenceChange = (criteriaId: number, subCriteriaId: string, evidence: string) => {
    setSubCriteriaEvidence(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: evidence,
      },
    }));
  };


  const handleSubmit = async (asDraft: boolean) => {
    if (!user?.studentCode || !rubric || !semester.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive"
      });
      return;
    }

    // Validation: score > maxPoints is not allowed for both "Lưu Nháp" and "Tạo Đánh giá"
    // Note: Negative scores are allowed (some criteria can deduct points)
    // Note: Total score = 0 is allowed (can happen in valid scenarios)
    const hasInvalidScores = criteriaWithSubCriteria.some(criterion => {
      return criterion.subCriteria.some(sub => {
        const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
        // Validate: score should not exceed maxPoints (applies to both draft and non-draft)
        // Negative scores are allowed (for criteria that deduct points)
        return score > sub.maxPoints;
      });
    });

    if (hasInvalidScores) {
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại điểm số. Điểm không được vượt quá điểm tối đa của tiêu chí.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Convert sub-criteria scores to evaluation details format
      // For each main criteria, create one detail with the total score
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
            const fileUrls = files.map(f => f.fileUrl).join(', ');
            return fileUrls ? `${sub.id}. ${sub.name}: ${fileUrls}` : '';
          })
          .filter(e => e)
          .join('\n');
        
        // Combine scores and evidence
        const combinedEvidence = scores ? `SCORES:${scores}|EVIDENCE:${subEvidence}` : `EVIDENCE:${subEvidence}`;

        return {
          criteriaId: criterion.id,
          score: criterion.totalScore, // Total of all sub-criteria (can be 0 for draft)
          evidence: combinedEvidence,
          note: '',
        };
      });

      const response = await createEvaluation({
        studentCode: user.studentCode,
        semester: semester.trim(),
        academicYear: rubric.academicYear,
        rubricId: rubric.id,
        details: details as any,
        asDraft: asDraft // Send draft flag to backend
      });

      if (response.success && response.data) {
        // If "Tạo Đánh giá" (not draft), automatically submit it
        if (!asDraft) {
          try {
            const submitResponse = await submitEvaluation(response.data.id);
            if (submitResponse.success) {
              toast({
                title: "Thành công",
                description: "Đánh giá đã được tạo và nộp thành công.",
              });
              router.push(`/evaluations/${response.data.id}`);
              return;
            }
          } catch (submitError: any) {
            // If submit fails, still show success for creation
            toast({
              title: "Đã tạo đánh giá",
              description: submitError.message || "Đánh giá đã được tạo nhưng chưa thể nộp. Vui lòng nộp sau.",
              variant: "default"
            });
            router.push(`/evaluations/${response.data.id}`);
            return;
          }
        }
        
        // If "Lưu Nháp" (draft), just save and redirect
        toast({
          title: "Thành công",
          description: "Đánh giá đã được lưu nháp. Bạn có thể tiếp tục chỉnh sửa sau.",
        });
        router.push(`/evaluations/${response.data.id}`);
      }
    } catch (error: any) {
      // If we reach here, it means all retries failed - this is a real error
      // Retry logic in API client handles transient errors automatically
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đánh giá. Vui lòng thử lại.",
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

  if (!rubric || criteria.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Không tìm thấy rubric đang active.</p>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tạo Đánh giá Mới</h1>
            <p className="text-muted-foreground">
              Điền thông tin đánh giá điểm rèn luyện
            </p>
          </div>
          
          {/* Alert if no open period */}
          {!checkingPeriod && !openPeriod && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không có đợt đánh giá đang mở</AlertTitle>
              <AlertDescription>
                Hiện tại không có đợt đánh giá nào đang mở. Bạn có thể tạo và lưu nháp đánh giá, 
                nhưng sẽ không thể nộp cho đến khi có đợt đánh giá mới được mở. 
                Vui lòng liên hệ quản trị viên để biết thêm thông tin.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Info if period is open */}
          {!checkingPeriod && openPeriod && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đợt đánh giá đang mở</AlertTitle>
              <AlertDescription>
                <strong>{openPeriod.name}</strong> - Học kỳ: {openPeriod.semester}
                <br />
                Thời gian: {new Date(openPeriod.startDate).toLocaleDateString('vi-VN')} 
                {' - '} 
                {new Date(openPeriod.endDate).toLocaleDateString('vi-VN')}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Đánh giá</CardTitle>
              <CardDescription>
                Rubric: {rubric.name} (Tối đa: {rubric.maxScore} điểm)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Học kỳ *</Label>
                <Input
                  id="semester"
                  placeholder="Ví dụ: 2024-2025-HK1"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiêu chí Đánh giá</CardTitle>
              <CardDescription>
                Tổng điểm hiện tại: <strong>{totalScore} / {rubric.maxScore}</strong>
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
                        const currentEvidence = subCriteriaEvidence[criterion.id]?.[sub.id] || '';
                        
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
                                  // Clamp value: allow negative if maxPoints suggests it (like -1 for retake)
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
                            criteriaId={criterion.id}
                            onFilesChange={(files) => {
                              // Store files for main criteria (fallback case)
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
              onClick={() => handleSubmit(true)}
              disabled={submitting || !semester.trim()}
              title="Lưu tạm để tiếp tục chỉnh sửa sau (không yêu cầu đầy đủ thông tin)"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Nháp'
              )}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !semester.trim()}
              title="Tạo và nộp đánh giá ngay (yêu cầu đầy đủ thông tin)"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang nộp...
                </>
              ) : (
                'Nộp Đánh giá'
              )}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
