"use client";

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
            <p className="text-muted-foreground">
              Xem báo cáo và thống kê hệ thống
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chức năng đang phát triển</CardTitle>
              <CardDescription>
                Tính năng báo cáo và thống kê đang được phát triển
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Tính năng này sẽ cho phép bạn:
                </p>
                <ul className="text-left text-muted-foreground space-y-2 mb-6">
                  <li>• Xem thống kê số lượng đánh giá theo trạng thái</li>
                  <li>• Báo cáo điểm rèn luyện theo khoa/ngành/lớp</li>
                  <li>• Xuất báo cáo Excel/PDF</li>
                  <li>• Biểu đồ và phân tích xu hướng</li>
                </ul>
                <Button variant="outline" disabled>
                  Đang phát triển
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

