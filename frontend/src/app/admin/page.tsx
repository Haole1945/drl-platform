"use client";

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Users, FileText, Award, Database } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản trị Hệ thống</h1>
            <p className="text-muted-foreground">
              Quản lý và cấu hình hệ thống
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý Sinh viên</CardTitle>
                <CardDescription>
                  Xem và quản lý thông tin sinh viên
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/students">
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Quản lý Sinh viên
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quản lý Đánh giá</CardTitle>
                <CardDescription>
                  Xem tất cả đánh giá trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/evaluations">
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Xem Đánh giá
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duyệt Đánh giá</CardTitle>
                <CardDescription>
                  Xem và duyệt các đánh giá đang chờ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/approvals">
                  <Button variant="outline" className="w-full">
                    <Award className="mr-2 h-4 w-4" />
                    Duyệt Đánh giá
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cấu hình Hệ thống</CardTitle>
                <CardDescription>
                  Cấu hình rubric, tiêu chí, và các thông số hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Đang phát triển
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quản lý Người dùng</CardTitle>
                <CardDescription>
                  Quản lý tài khoản và phân quyền
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Users className="mr-2 h-4 w-4" />
                  Đang phát triển
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Báo cáo & Thống kê</CardTitle>
                <CardDescription>
                  Xem báo cáo và thống kê hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <Database className="mr-2 h-4 w-4" />
                  Đang phát triển
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin Hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Phiên bản:</span>{' '}
                  <span className="text-muted-foreground">1.0.0</span>
                </div>
                <div>
                  <span className="font-medium">Môi trường:</span>{' '}
                  <span className="text-muted-foreground">Development</span>
                </div>
                <div>
                  <span className="font-medium">Trạng thái:</span>{' '}
                  <span className="text-green-600">Hoạt động bình thường</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
