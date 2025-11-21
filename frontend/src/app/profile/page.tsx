"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPrimaryRoleDisplayName } from '@/lib/role-utils';
import { User, Mail, Key, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Convert date value (string or array) to Date object
 * Handles LocalDateTime array format: [year, month, day, hour, minute, second, nanosecond]
 */
function parseDate(dateValue: string | number[] | undefined): Date | null {
  if (!dateValue) return null;
  
  try {
    let date: Date;
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      date = new Date(year, month - 1, day, hour, minute, second);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Không tìm thấy thông tin người dùng.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
            <p className="text-muted-foreground">
              Xem và quản lý thông tin tài khoản của bạn
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Thông tin tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên đăng nhập</label>
                  <p className="text-sm font-medium mt-1">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-sm font-medium mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  <p className="text-sm font-medium mt-1">{user.fullName}</p>
                </div>
                {user.studentCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mã sinh viên</label>
                    <p className="text-sm font-medium mt-1">{user.studentCode}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vai trò</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {getPrimaryRoleDisplayName(user)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Bảo mật
                </CardTitle>
                <CardDescription>
                  Quản lý mật khẩu và bảo mật tài khoản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mật khẩu</label>
                  <p className="text-sm text-muted-foreground mt-1">••••••••</p>
                </div>
                <Link href="/profile/change-password">
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông tin tài khoản
                </CardTitle>
                <CardDescription>
                  Thông tin về tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                  <div className="mt-1">
                    <Badge variant={(user.isActive ?? user.enabled ?? true) ? "default" : "secondary"}>
                      {(user.isActive ?? user.enabled ?? true) ? "Hoạt động" : "Vô hiệu hóa"}
                    </Badge>
                  </div>
                </div>
                {(() => {
                  const createdDate = parseDate(user.createdAt);
                  if (!createdDate) return null;
                  return (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngày tạo</label>
                      <p className="text-sm font-medium mt-1">
                        {format(createdDate, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                      </p>
                    </div>
                  );
                })()}
                {(() => {
                  const updatedDate = parseDate(user.updatedAt);
                  if (!updatedDate) return null;
                  return (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cập nhật lần cuối</label>
                      <p className="text-sm font-medium mt-1">
                        {format(updatedDate, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


