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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getEvaluationById, getCriteriaByRubric, updateEvaluation, resubmitEvaluation } from '@/lib/evaluation';
import type { Evaluation, Criteria } from '@/types/evaluation';
import { parseSubCriteria, calculateCriteriaTotal } from '@/lib/criteria-parser';
import { FileUpload, type UploadedFile } from '@/components/FileUpload';
import { Loader2, AlertCircle, Save, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseEvidence } from '@/lib/evidence-parser';

export default function EditEvaluationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [responseToRejection, setResponseToRejection] = useState('');
  
  // State for sub-criteria scores and files
  const [subCriteriaScores, setSubCriteriaScores] = useState<Record<number, Record<string, number>>>({});
  const [subCriteriaEvidence, setSubCriteriaEvidence] = useState<Record<number, Record<string, string>>>({});
  const [subCriteriaFiles, setSubCriteriaFiles] = useState<Record<number, Record<string, UploadedFile[]>>>({});

  const evaluationId = params?.id ? parseInt(params.id as string) : null;
  const isRejected = evaluation?.status === 'REJECTED';

  // Parse criteria with sub-criteria
  const criteriaWithSubCriteria = useMemo(() => {
    return criteria.map(criterion => {
      const parsedSubCriteria = parseSubCriteria(criterion.orderIndex, criterion.description || '');
      const scores = subCriteriaScores[criterion.id] || {};
      // Map parsed sub-criteria to include score and evidence
      const subCriteria = parsedSubCriteria.map(sub => ({
        ...sub,
        score: scores[sub.id] || 0,
        evidence: subCriteriaEvidence[criterion.id]?.[sub.id] || '',
      }));
      const totalScore = calculateCriteriaTotal(subCriteria, scores);
      
      return {
        ...criterion,
        subCriteria,
        totalScore,
      };
    });
  }, [criteria, subCriteriaScores, subCriteriaEvidence]);

  const totalScore = useMemo(() => {
    return criteriaWithSubCriteria.reduce((sum, c) => sum + c.totalScore, 0);
  }, [criteriaWithSubCriteria]);

  useEffect(() => {
    if (!evaluationId) return;

    const loadData = async () => {
      try {
        const evalResponse = await getEvaluationById(evaluationId);
        if (!evalResponse.success || !evalResponse.data) {
          throw new Error('Không tìm thấy đánh giá');
        }

        const evalData = evalResponse.data;
        setEvaluation(evalData);

        // Check if user is owner
        if (user?.studentCode !== evalData.studentCode) {
          toast({
            title: "Lỗi",
            description: "Bạn không có quyền chỉnh sửa đánh giá này",
            variant: "destructive"
          });
          router.push('/evaluations');
          return;
        }

        // Check if can edit
        if (evalData.status !== 'DRAFT' && evalData.status !== 'REJECTED') {
          toast({
            title: "Lỗi",
            description: "Chỉ có thể chỉnh sửa đánh giá ở trạng thái Nháp hoặc Bị từ chối",
            variant: "destructive"
          });
          router.push(`/evaluations/${evaluationId}`);
          return;
        }

        // Load criteria
        const criteriaResponse = await getCriteriaByRubric(evalData.rubricId);
        if (criteriaResponse.success && criteriaResponse.data) {
          setCriteria(criteriaResponse.data);

          // Pre-fill scores and files from existing evaluation
          const scoresMap: Record<number, Record<string, number>> = {};
          const evidenceMap: Record<number, Record<string, string>> = {};
          const filesMap: Record<number, Record<string, UploadedFile[]>> = {};
          
          evalData.details?.forEach((detail: any) => {
            const criteriaId = detail.criteriaId;
            if (!scoresMap[criteriaId]) {
              scoresMap[criteriaId] = {};
              evidenceMap[criteriaId] = {};
              filesMap[criteriaId] = {};
            }

            // Parse evidence to extract scores and files
            const parsedEvidence = parseEvidence(detail.evidence || detail.comment || '');
            
            // Set scores and files for each sub-criteria
            parsedEvidence.forEach(item => {
              if (item.score !== undefined) {
                scoresMap[criteriaId][item.subCriteriaId] = item.score;
              }
              if (item.fileUrls && item.fileUrls.length > 0) {
                filesMap[criteriaId][item.subCriteriaId] = item.fileUrls.map((url, idx) => ({
                  id: Date.now() + idx + Math.random(),
                  fileUrl: url,
                  fileName: url.split('/').pop() || 'file',
                  fileType: 'application/pdf',
                  fileSize: 0,
                }));
              }
            });
          });

          setSubCriteriaScores(scoresMap);
          setSubCriteriaEvidence(evidenceMap);
          setSubCriteriaFiles(filesMap);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tải đánh giá",
          variant: "destructive"
        });
        router.push('/evaluations');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evaluationId, user, router, toast]);

  const handleSubCriteriaScoreChange = (criteriaId: number, subCriteriaId: string, value: number) => {
    setSubCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...(prev[criteriaId] || {}),
        [subCriteriaId]: value
      }
    }));
  };

  const handleSave = async (shouldSubmit: boolean = false) => {
    if (!evaluationId || !evaluation) return;

    setSubmitting(true);
    try {
      // Build details array (same format as create)
      const details = criteriaWithSubCriteria.map((criterion: any) => {
        const scores = criterion.subCriteria
          .map((sub: any) => {
            const score = subCriteriaScores[criterion.id]?.[sub.id] || 0;
            return `${sub.id}=${score}`;
          })
          .join(',');
        
        const subEvidence = criterion.subCriteria
          .map((sub: any) => {
            const files = subCriteriaFiles[criterion.id]?.[sub.id] || [];
            const fileUrls = files.map(f => f.fileUrl).join(', ');
            return fileUrls ? `${sub.id}. ${sub.name}: ${fileUrls}` : '';
          })
          .filter((e: string) => e)
          .join('\n');
        
        const combinedEvidence = scores ? `SCORES:${scores}|EVIDENCE:${subEvidence}` : `EVIDENCE:${subEvidence}`;

        return {
          criteriaId: criterion.id,
          score: criterion.totalScore,
          evidence: combinedEvidence,
          note: '',
        };
      });

      if (isRejected && shouldSubmit) {
        // Resubmit after rejection
        const response = await resubmitEvaluation(evaluationId, {
          details: details as any,
          responseToRejection: responseToRejection || undefined
        });

        if (response.success) {
          toast({
            title: "Thành công",
            description: "Đánh giá đã được nộp lại thành công"
          });
          router.push(`/evaluations/${evaluationId}`);
        }
      } else {
        // Regular update
        const response = await updateEvaluation(evaluationId, { details: details as any });

        if (response.success) {
          toast({
            title: "Thành công",
            description: shouldSubmit ? "Đánh giá đã được nộp" : "Đã lưu thay đổi"
          });
          router.push(`/evaluations/${evaluationId}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu đánh giá",
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

  if (!evaluation) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">
              {isRejected ? 'Chỉnh sửa & Nộp lại Đánh giá' : 'Chỉnh sửa Đánh giá'}
            </h1>
            <p className="text-muted-foreground">
              {evaluation.semester} - {evaluation.academicYear}
            </p>
          </div>

          {isRejected && evaluation.rejectionReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Đánh giá bị từ chối</AlertTitle>
              <AlertDescription>
                <strong>Lý do:</strong> {evaluation.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {isRejected && (
            <Card>
              <CardHeader>
                <CardTitle>Phản hồi về lý do từ chối</CardTitle>
                <CardDescription>
                  Giải thích những thay đổi bạn đã thực hiện
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ví dụ: Đã bổ sung minh chứng cho tiêu chí 1.1, sửa điểm tiêu chí 2.3..."
                  value={responseToRejection}
                  onChange={(e) => setResponseToRejection(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tiêu chí Đánh giá</CardTitle>
              <CardDescription>
                Tổng điểm hiện tại: <strong>{totalScore}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteriaWithSubCriteria.map((criterion: any, index: number) => (
                <div key={criterion.id} className="space-y-4 border rounded-lg p-4">
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

                  {criterion.subCriteria.length > 0 && (
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
                      
                      {criterion.subCriteria.map((sub: any) => {
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
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              Hủy
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={submitting}>
              <Save className="mr-2 h-4 w-4" />
              Lưu nháp
            </Button>
            <Button onClick={() => handleSave(true)} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isRejected ? 'Nộp lại' : 'Nộp đánh giá'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
