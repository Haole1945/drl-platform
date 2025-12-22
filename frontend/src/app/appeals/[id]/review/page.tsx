/**
 * Appeal Review Page (Reviewer)
 * Allows faculty/admin to review and accept/reject appeals
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppealStatusBadge } from "@/components/AppealStatusBadge";
import { useToast } from "@/hooks/use-toast";
import { getAppealById, reviewAppeal } from "@/lib/api/appeals";
import type { Appeal, AppealDecision } from "@/types/appeal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, FileText, Calendar, User, CheckCircle, XCircle } from "lucide-react";

export default function AppealReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<AppealDecision | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAppeal();
  }, [params.id]);

  const loadAppeal = async () => {
    setLoading(true);
    try {
      const response = await getAppealById(parseInt(params.id));
      if (response.success && response.data) {
        setAppeal(response.data);
      }
    } catch (error) {
      console.error("Failed to load appeal:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khiếu nại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (decision: AppealDecision) => {
    // Validation
    if (!reviewComment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nhận xét",
        variant: "destructive",
      });
      return;
    }

    if (reviewComment.trim().length < 10) {
      toast({
        title: "Lỗi",
        description: "Nhận xét phải có ít nhất 10 ký tự",
        variant: "destructive",
      });
      return;
    }

    setPendingDecision(decision);
    setShowConfirmDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!pendingDecision || !appeal) return;

    setSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const response = await reviewAppeal(appeal.id, {
        decision: pendingDecision,
        comment: reviewComment.trim(),
      });

      if (!response.success) {
        throw new Error(response.message || "Không thể xử lý khiếu nại");
      }

      toast({
        title: "Thành công",
        description:
          pendingDecision === "ACCEPT"
            ? "Khiếu nại đã được chấp nhận"
            : "Khiếu nại đã bị từ chối",
      });

      router.push("/appeals");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xử lý khiếu nại",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Không tìm thấy khiếu nại</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/appeals")}
            >
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReviewed = appeal.status === "ACCEPTED" || appeal.status === "REJECTED";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/appeals")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Xét duyệt khiếu nại</h1>
          <p className="text-muted-foreground">
            Khiếu nại #{appeal.id} - {appeal.studentName || appeal.studentCode}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Thông tin khiếu nại</span>
            <AppealStatusBadge status={appeal.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sinh viên</p>
              <p className="font-medium">
                {appeal.studentName || appeal.studentCode}
              </p>
              <p className="text-sm text-muted-foreground">{appeal.studentCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Học kỳ</p>
              <p className="font-medium">{appeal.evaluationSemester || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày gửi</p>
              <p className="font-medium">{formatDate(appeal.createdAt)}</p>
            </div>
            {appeal.reviewDate && (
              <div>
                <p className="text-sm text-muted-foreground">Ngày xét duyệt</p>
                <p className="font-medium">{formatDate(appeal.reviewDate)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appeal Reason */}
      <Card>
        <CardHeader>
          <CardTitle>Lý do khiếu nại</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{appeal.appealReason}</p>
        </CardContent>
      </Card>

      {/* Appealed Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Tiêu chí khiếu nại</CardTitle>
        </CardHeader>
        <CardContent>
          {appeal.appealedCriteria.length === 0 ? (
            <p className="text-muted-foreground">Khiếu nại toàn bộ đánh giá</p>
          ) : (
            <div className="space-y-2">
              {appeal.appealedCriteria.map((criteria) => (
                <div
                  key={criteria.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{criteria.criteriaName || `Tiêu chí #${criteria.criteriaId}`}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidence Files */}
      {appeal.evidenceFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minh chứng đính kèm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appeal.evidenceFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.fileName}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {isReviewed ? (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả xét duyệt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quyết định:</p>
              <AppealStatusBadge status={appeal.status} />
            </div>
            {appeal.reviewerName && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Người xét duyệt:</p>
                <p>{appeal.reviewerName}</p>
              </div>
            )}
            {appeal.reviewComment && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nhận xét:</p>
                <p className="whitespace-pre-wrap border-l-4 border-muted pl-4">
                  {appeal.reviewComment}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Xét duyệt khiếu nại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewComment">
                Nhận xét <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reviewComment"
                placeholder="Nhập nhận xét của bạn (tối thiểu 10 ký tự)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={5}
                className="resize-none"
                disabled={submitting}
              />
              <p className="text-sm text-muted-foreground">
                {reviewComment.length} ký tự
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => handleReviewClick("ACCEPT")}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Chấp nhận
              </Button>
              <Button
                onClick={() => handleReviewClick("REJECT")}
                disabled={submitting}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Evaluation */}
      <Card>
        <CardContent className="py-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/evaluations/${appeal.evaluationId}`)}
          >
            Xem đánh giá gốc
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDecision === "ACCEPT" ? "Chấp nhận khiếu nại?" : "Từ chối khiếu nại?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDecision === "ACCEPT"
                ? "Khiếu nại sẽ được chấp nhận và đánh giá sẽ được chuyển về trạng thái CLASS_APPROVED để xem xét lại."
                : "Khiếu nại sẽ bị từ chối. Sinh viên có thể nộp khiếu nại mới nếu còn trong thời hạn."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReview}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
