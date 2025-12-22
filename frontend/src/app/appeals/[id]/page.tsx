/**
 * Appeal Detail Page (Student View)
 * Shows appeal details and review decision
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppealStatusBadge } from "@/components/AppealStatusBadge";
import { getAppealById } from "@/lib/api/appeals";
import type { Appeal } from "@/types/appeal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";

export default function AppealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
              onClick={() => router.push("/appeals/my")}
            >
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/appeals/my")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chi tiết khiếu nại</h1>
          <p className="text-muted-foreground">
            Khiếu nại #{appeal.id} - {appeal.evaluationSemester}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trạng thái</span>
            <AppealStatusBadge status={appeal.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ngày gửi:</span>
            <span>{formatDate(appeal.createdAt)}</span>
          </div>
          {appeal.reviewDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ngày xét duyệt:</span>
              <span>{formatDate(appeal.reviewDate)}</span>
            </div>
          )}
          {appeal.reviewerName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Người xét duyệt:</span>
              <span>{appeal.reviewerName}</span>
            </div>
          )}
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

      {/* Review Decision */}
      {(appeal.status === "ACCEPTED" || appeal.status === "REJECTED") && (
        <Card>
          <CardHeader>
            <CardTitle>
              Kết quả xét duyệt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quyết định:</p>
              <AppealStatusBadge status={appeal.status} />
            </div>
            {appeal.reviewComment && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nhận xét:</p>
                <p className="whitespace-pre-wrap border-l-4 border-muted pl-4">
                  {appeal.reviewComment}
                </p>
              </div>
            )}
            {appeal.status === "ACCEPTED" && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  Khiếu nại của bạn đã được chấp nhận. Đánh giá sẽ được xem xét lại.
                </p>
              </div>
            )}
            {appeal.status === "REJECTED" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Khiếu nại của bạn đã bị từ chối. Bạn có thể nộp khiếu nại mới nếu
                  còn trong thời hạn.
                </p>
              </div>
            )}
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
    </div>
  );
}
