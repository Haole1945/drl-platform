/**
 * Appeals Management Page (Reviewer)
 * Shows pending appeals for faculty/admin to review
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppealStatusBadge } from "@/components/AppealStatusBadge";
import { getPendingAppeals } from "@/lib/api/appeals";
import type { Appeal } from "@/types/appeal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AppealsManagementPage() {
  const router = useRouter();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadAppeals();
  }, [page]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const response = await getPendingAppeals(page, 20);
      if (response.success && response.data) {
        setAppeals(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      }
    } catch (error) {
      // Silently handle error - API might not be available yet
      setAppeals([]);
      setTotalPages(0);
      setTotalElements(0);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý khiếu nại</h1>
          <p className="text-muted-foreground">
            Danh sách khiếu nại cần xét duyệt
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Khiếu nại chờ xử lý ({totalElements})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : appeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Không có khiếu nại nào cần xử lý.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sinh viên</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số tiêu chí</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow
                      key={appeal.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/appeals/${appeal.id}/review`)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <p>{appeal.studentName || appeal.studentCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {appeal.studentCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{appeal.evaluationSemester || "N/A"}</TableCell>
                      <TableCell>{formatDate(appeal.createdAt)}</TableCell>
                      <TableCell>
                        <AppealStatusBadge status={appeal.status} />
                      </TableCell>
                      <TableCell>
                        {appeal.appealedCriteria.length === 0
                          ? "Toàn bộ"
                          : `${appeal.appealedCriteria.length} tiêu chí`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/appeals/${appeal.id}/review`);
                          }}
                        >
                          Xét duyệt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {page + 1} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
