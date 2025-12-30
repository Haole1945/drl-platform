"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPrimaryRoleDisplayName } from '@/lib/role-utils';
import { User, Mail, Key, Calendar, Loader2, PenTool, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SignatureManager } from '@/components/SignatureManager';
import { deleteSignature } from '@/lib/api/signature';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080/api';

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

import { getStudentByCode } from '@/lib/student';
import type { Student } from '@/lib/student';

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [deletingSignature, setDeletingSignature] = useState(false);
  const { toast } = useToast();

  // Load student info if user is a student
  useEffect(() => {
    const loadStudentInfo = async () => {
      if (user?.studentCode) {
        setLoadingStudent(true);
        try {
          const response = await getStudentByCode(user.studentCode);
          if (response.success && response.data) {
            setStudentInfo(response.data);
          }
        } catch (error) {
          // Failed to load student info - continue without it
        } finally {
          setLoadingStudent(false);
        }
      }
    };
    loadStudentInfo();
  }, [user]);

  const handleSignatureUpdated = () => {
    // Refresh user data to get updated signature
    refreshUser();
    // Reload page to ensure image is displayed correctly
    window.location.reload();
  };

  const handleDeleteSignature = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa chữ ký?')) {
      return;
    }

    setDeletingSignature(true);
    try {
      await deleteSignature();
      toast({
        title: 'Thành công',
        description: 'Chữ ký đã được xóa',
      });
      refreshUser();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xóa chữ ký',
        variant: 'destructive',
      });
    } finally {
      setDeletingSignature(false);
    }
  };

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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                {user.classCode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lớp</label>
                    <p className="text-sm font-medium mt-1">{studentInfo?.className || user.classCode}</p>
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

            {studentInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin sinh viên</CardTitle>
                  <CardDescription>
                    Thông tin chi tiết về sinh viên
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentInfo.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                      <p className="text-sm font-medium mt-1">
                        {(() => {
                          try {
                            const date = Array.isArray(studentInfo.dateOfBirth)
                              ? new Date(studentInfo.dateOfBirth[0], studentInfo.dateOfBirth[1] - 1, studentInfo.dateOfBirth[2])
                              : new Date(studentInfo.dateOfBirth);
                            return format(date, 'dd/MM/yyyy', { locale: vi });
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                  {studentInfo.gender && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                      <p className="text-sm font-medium mt-1">
                        {studentInfo.gender === 'MALE' ? 'Nam' : studentInfo.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </p>
                    </div>
                  )}
                  {studentInfo.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                      <p className="text-sm font-medium mt-1">{studentInfo.phone}</p>
                    </div>
                  )}
                  {studentInfo.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Địa chỉ</label>
                      <p className="text-sm font-medium mt-1">{studentInfo.address}</p>
                    </div>
                  )}
                  {studentInfo.majorName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngành</label>
                      <p className="text-sm font-medium mt-1">{studentInfo.majorName}</p>
                    </div>
                  )}
                  {studentInfo.facultyName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Khoa</label>
                      <p className="text-sm font-medium mt-1">{studentInfo.facultyName}</p>
                    </div>
                  )}
                  {studentInfo.academicYear && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Niên khóa</label>
                      <p className="text-sm font-medium mt-1">{studentInfo.academicYear}</p>
                    </div>
                  )}
                  {studentInfo.position && studentInfo.position !== 'NONE' && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Chức vụ</label>
                      <div className="mt-1">
                        <Badge variant="default">
                          {studentInfo.position === 'CLASS_MONITOR' ? 'Lớp trưởng' :
                           studentInfo.position === 'VICE_MONITOR' ? 'Lớp phó' :
                           studentInfo.position === 'SECRETARY' ? 'Bí thư' :
                           studentInfo.position}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
              <CardContent className="space-y-3">
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSignatureDialogOpen(true)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Quản lý chữ ký
                </Button>
              </CardContent>
            </Card>

            {user.signatureImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    Chữ Ký Điện Tử
                  </CardTitle>
                  <CardDescription>
                    Chữ ký của bạn sẽ được sử dụng khi duyệt đánh giá
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                    <img 
                      src={`${API_BASE_URL}${user.signatureImageUrl}`}
                      alt="Chữ ký" 
                      className="max-h-24"
                      onError={(e) => {
                        console.error('Failed to load signature image:', user.signatureImageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  {user.signatureUploadedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tạo lúc</label>
                      <p className="text-sm font-medium mt-1">
                        {(() => {
                          try {
                            const date = Array.isArray(user.signatureUploadedAt)
                              ? new Date(user.signatureUploadedAt[0], user.signatureUploadedAt[1] - 1, user.signatureUploadedAt[2], user.signatureUploadedAt[3] || 0, user.signatureUploadedAt[4] || 0)
                              : new Date(user.signatureUploadedAt);
                            return format(date, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSignatureDialogOpen(true)}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={handleDeleteSignature}
                      disabled={deletingSignature}
                    >
                      {deletingSignature ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="md:col-span-2 lg:col-span-3">
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

          <SignatureManager
            open={signatureDialogOpen}
            onOpenChange={setSignatureDialogOpen}
            onSignatureUpdated={handleSignatureUpdated}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


