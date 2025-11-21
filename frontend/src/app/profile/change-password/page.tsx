"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
        variant: "destructive"
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải khác mật khẩu hiện tại.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        toast({
          title: "Thành công",
          description: "Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.",
        });
        
        // Logout user after password change for security
        // Wait a bit to show the success message
        setTimeout(async () => {
          await logout();
          router.push('/login?message=password-changed');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Đổi mật khẩu</h1>
            <p className="text-muted-foreground">
              Thay đổi mật khẩu tài khoản của bạn
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Thay đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                      disabled={submitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                      minLength={6}
                      disabled={submitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      disabled={submitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Đổi mật khẩu
                      </>
                    )}
                  </Button>
                  <Link href="/profile">
                    <Button type="button" variant="outline" disabled={submitting}>
                      Hủy
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


