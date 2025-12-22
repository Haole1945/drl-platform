"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Award, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login: setAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login({ username, password });
      
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.accessToken);
        toast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng trở lại!',
        });
        router.push('/dashboard');
      } else {
        // Handle case where response is not successful but no error thrown
        toast({
          title: 'Đăng nhập thất bại',
          description: response.message || 'Sai tên đăng nhập hoặc mật khẩu.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Extract user-friendly error message
      let errorMessage = 'Sai tên đăng nhập hoặc mật khẩu.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Translate common error messages to Vietnamese
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo server đang chạy.';
        } else if (error.message.includes('503')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Sai tên đăng nhập hoặc mật khẩu.';
        } else if (error.message.includes('Invalid') || error.message.includes('credentials')) {
          errorMessage = 'Sai tên đăng nhập hoặc mật khẩu.';
        }
      }
      
      toast({
        title: 'Đăng nhập thất bại',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your DRL Platform account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email hoặc Mã sinh viên</Label>
              <Input
                id="username"
                type="text"
                placeholder="Email hoặc mã sinh viên (ví dụ: n21dccn001)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  style={{
                    // Hide browser's default password reveal button
                    WebkitTextSecurity: showPassword ? 'none' : undefined,
                  } as React.CSSProperties}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Chưa có mật khẩu?{' '}
              <Link href="/request-password" className="text-primary hover:underline">
                Yêu cầu mật khẩu
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

