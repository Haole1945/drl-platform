/**
 * Student Appeals List Page
 * Shows all appeals created by the logged-in student
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
import { getMyAppeals } from "@/lib/api/appeals";
import type { Appeal } from "@/types/appeal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function MyAppealsPage() {
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
      const response = await getMyAppeals(page, 20);
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
          <h1 className="text-3xl font-bold">Khiếu nại của tôi</h1>
          <p className="text-muted-foreground">
            Danh sách các khiếu nại bạn đã gửi
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách khiếu nại ({totalElements})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : appeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Bạn chưa có khiếu nại nào.</p>
              <p className="text-sm mt-2">
                Khiếu nại chỉ có thể được tạo sau khi đánh giá được duyệt bởi khoa.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
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
                      onClick={() => router.push(`/appeals/${appeal.id}`)}
                    >
                      <TableCell className="font-medium">
                        {appeal.evaluationSemester || "N/A"}
                      </TableCell>
                      <TableCell>{formatDate(appeal.createdAt)}</TableCell>
                      <TableCell>
                        <AppealStatusBadge status={appeal.status} />
                      </TableCell>
                      <TableCell>
                        {appeal.appealedCriteria.length} tiêu chí
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/appeals/${appeal.id}`);
                          }}
                        >
                          Xem chi tiết
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
