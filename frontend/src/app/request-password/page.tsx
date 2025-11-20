"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Award, Mail } from 'lucide-react';

export default function RequestPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate email format
      if (!email.endsWith('@student.ptithcm.edu.vn')) {
        toast({
          title: 'Email không hợp lệ',
          description: 'Vui lòng nhập email trường (ví dụ: n21dccn001@student.ptithcm.edu.vn)',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const response = await requestPassword({ email });
      
      if (response.success) {
        toast({
          title: 'Yêu cầu thành công',
          description: 'Mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Yêu cầu thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Yêu cầu mật khẩu</CardTitle>
          <CardDescription>
            Nhập email trường để nhận mật khẩu đăng nhập. Tài khoản sẽ được tạo tự động lần đầu tiên.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email trường</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="n21dccn001@student.ptithcm.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Định dạng: mã sinh viên@student.ptithcm.edu.vn<br/>
                Ví dụ: n21dccn001@student.ptithcm.edu.vn<br/>
                <span className="text-primary font-medium">Tên đăng nhập sẽ là mã sinh viên (ví dụ: n21dccn001)</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi mật khẩu'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Đã có mật khẩu?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

