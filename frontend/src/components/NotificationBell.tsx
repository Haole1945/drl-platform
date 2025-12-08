"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getUnreadNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notification';
import type { Notification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      console.log('[NotificationBell] Loading notifications...');
      const [notificationsResponse, countResponse] = await Promise.all([
        getUnreadNotifications(),
        getUnreadCount(),
      ]);

      console.log('[NotificationBell] Notifications response:', notificationsResponse);
      console.log('[NotificationBell] Count response:', countResponse);

      if (notificationsResponse.success && notificationsResponse.data) {
        console.log('[NotificationBell] Found', notificationsResponse.data.length, 'notifications');
        setNotifications(notificationsResponse.data);
      } else {
        console.warn('[NotificationBell] Failed to get notifications:', notificationsResponse);
      }
      if (countResponse.success && countResponse.data !== undefined) {
        console.log('[NotificationBell] Unread count:', countResponse.data);
        setUnreadCount(countResponse.data);
      } else {
        console.warn('[NotificationBell] Failed to get count:', countResponse);
      }
    } catch (error: any) {
      // Log error for debugging
      console.error('[NotificationBell] Failed to load notifications:', error);
      // Silently handle errors - notifications are not critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo đã đọc.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
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
      // For reviewers - link to approvals page
      if (notification.type === 'EVALUATION_NEEDS_REVIEW' || notification.type === 'EVALUATION_ESCALATED') {
        return '/approvals';
      }
      // For students - link to evaluation detail
      return `/evaluations/${notification.relatedId}`;
    }
    return null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Thông báo</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              Không có thông báo mới
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const content = (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id);
                      }
                      if (link) {
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          {notification.title}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              const date = new Date(notification.createdAt);
                              if (isNaN(date.getTime())) {
                                return 'Vừa xong';
                              }
                              return formatDistanceToNow(date, {
                                addSuffix: true,
                                locale: vi,
                              });
                            } catch {
                              return 'Vừa xong';
                            }
                          })()}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
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
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link href="/notifications">
              <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
                Xem tất cả thông báo
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

