"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getEvaluationById, submitEvaluation, approveEvaluation, rejectEvaluation, getActiveRubric, getCriteriaByRubric, deleteEvaluation } from '@/lib/evaluation';
import { StatusBadge } from '@/components/StatusBadge';
import { EvaluationHistory } from '@/components/EvaluationHistory';
import { canApproveClassLevel, canApproveFacultyLevel, canApproveCtsvLevel } from '@/lib/role-utils';
import type { Evaluation, Rubric, Criteria, CriteriaWithSubCriteria } from '@/types/evaluation';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Check, X, Edit, ExternalLink, Trash2 } from 'lucide-react';
import { getOpenPeriod } from '@/lib/api';
import { parseSubCriteria } from '@/lib/criteria-parser';
import { parseEvidence, getFileNameFromUrl } from '@/lib/evidence-parser';
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [openPeriod, setOpenPeriod] = useState<any>(null);
  const [canEditInPeriod, setCanEditInPeriod] = useState(false);

  const evaluationId = params?.id ? parseInt(params.id as string) : null;

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
        // Convert fileUrls to file objects with url property
        const files = (evidenceData?.fileUrls || []).map(url => ({ url }));
        return {
          ...sub,
          score: score, // Use score from parsed evidence
          evidence: files,
        };
      });

      return {
        ...criterion,
        subCriteria: subCriteriaWithData,
        totalScore: detail?.score || detail?.selfScore || 0,
      };
    });
  }, [criteria, evaluation]);

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
            const startDate = new Date(periodResponse.data.startDate);
            const endDate = new Date(periodResponse.data.endDate);
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
      const response = await approveEvaluation(evaluationId, approvalComment || undefined);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đánh giá đã được duyệt.",
        });
        setEvaluation(response.data);
        setShowApproveDialog(false);
        setApprovalComment('');
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
    (evaluation.status === 'CLASS_APPROVED' && canApproveFacultyLevel(user)) ||
    (evaluation.status === 'FACULTY_APPROVED' && canApproveCtsvLevel(user))
  );
  const canSubmit = isOwner && evaluation.status === 'DRAFT';
  const canDelete = isOwner && evaluation.status === 'DRAFT';
  
  // Only owner can edit their own evaluation
  const canEdit = isOwner && (
    evaluation.status === 'DRAFT' || 
    evaluation.status === 'REJECTED' ||
    (canEditInPeriod && (evaluation.status === 'SUBMITTED' || evaluation.status === 'CLASS_APPROVED' || evaluation.status === 'FACULTY_APPROVED'))
  );

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

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
                    <p className="text-sm">{new Date(evaluation.submittedAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
                {evaluation.approvedAt && (
                  <div>
                    <Label>Ngày duyệt</Label>
                    <p className="text-sm">{new Date(evaluation.approvedAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>
              {evaluation.rejectionReason && (
                <div>
                  <Label>Lý do từ chối</Label>
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {evaluation.rejectionReason}
                  </p>
                </div>
              )}
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

                  {/* Sub-Criteria Table */}
                  {criterion.subCriteria.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <div className="col-span-1">Mã</div>
                        <div className="col-span-5">Tên tiêu chí</div>
                        <div className="col-span-2 text-center">Điểm tối đa</div>
                        <div className="col-span-2 text-center">Điểm tự chấm</div>
                        <div className="col-span-2 text-center">Bằng chứng</div>
                      </div>
                      
                      {criterion.subCriteria.map((sub) => (
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
                          <div className="col-span-2 text-center text-sm">
                            {/* Always show score (0 if not available, since individual sub-criteria scores aren't stored) */}
                            {sub.score || 0}
                          </div>
                          <div className="col-span-2 flex justify-center items-center">
                            {sub.evidence && sub.evidence.length > 0 ? (
                              <div className="flex flex-col gap-1 items-center">
                                {sub.evidence.slice(0, 3).map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={`${API_BASE}${file.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {getFileNameFromUrl(file.url)}
                                  </a>
                                ))}
                                {sub.evidence.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{sub.evidence.length - 3} file
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground text-center">-</span>
                            )}
                          </div>
                        </div>
                      ))}
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

          {/* History Component */}
          <EvaluationHistory 
            history={evaluation.history || []} 
            resubmissionCount={evaluation.resubmissionCount}
          />

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
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
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
                      <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
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
