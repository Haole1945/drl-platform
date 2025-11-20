"use client";

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notification';
import type { Notification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { Loader2, Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const { toast } = useToast();

  const loadNotifications = async (pageNum: number = 0) => {
    setLoading(true);
    try {
      const response = await getNotifications(pageNum, 20);
      if (response.success && response.data) {
        setNotifications(response.data.content);
        setTotalPages(response.data.totalPages);
        setPage(response.data.number);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông báo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId);
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo đã đọc.",
        variant: "destructive"
      });
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo đã đọc.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả thông báo đã đọc.",
        variant: "destructive"
      });
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.relatedType === 'EVALUATION_PERIOD' && notification.relatedId) {
      return '/evaluations/new';
    }
    if (notification.relatedType === 'EVALUATION' && notification.relatedId) {
      return `/evaluations/${notification.relatedId}`;
    }
    return null;
  };

  const getNotificationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'PERIOD_CREATED': 'Đợt đánh giá mới',
      'PERIOD_REMINDER': 'Nhắc nhở',
      'PERIOD_ENDING': 'Sắp kết thúc',
      'EVALUATION_SUBMITTED': 'Đã nộp',
      'EVALUATION_APPROVED': 'Đã duyệt',
      'EVALUATION_REJECTED': 'Bị từ chối',
    };
    return labels[type] || type;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Thông báo</h1>
              <p className="text-muted-foreground">
                Xem tất cả thông báo của bạn
              </p>
            </div>
            {notifications.some(n => !n.isRead) && (
              <Button onClick={handleMarkAllAsRead} variant="outline">
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có thông báo nào</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const link = getNotificationLink(notification);
                  const content = (
                    <Card key={notification.id} className={!notification.isRead ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <h3 className="font-semibold mb-1">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(notification.createdAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </span>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markingAsRead === notification.id}
                            >
                              {markingAsRead === notification.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCheck className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );

                  if (link) {
                    return (
                      <Link key={notification.id} href={link}>
                        {content}
                      </Link>
                    );
                  }

                  return content;
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadNotifications(page - 1)}
                    disabled={page === 0 || loading}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => loadNotifications(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


