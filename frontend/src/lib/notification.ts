/**
 * Notification API functions
 */

import { apiClient } from './api';
import type { ApiResponse } from './api';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
  readAt?: string;
}

export type NotificationType = 
  | 'PERIOD_CREATED'
  | 'PERIOD_REMINDER'
  | 'PERIOD_ENDING'
  | 'EVALUATION_SUBMITTED'
  | 'EVALUATION_APPROVED'
  | 'EVALUATION_REJECTED'
  | 'EVALUATION_RETURNED'
  | 'EVALUATION_NEEDS_REVIEW'
  | 'EVALUATION_ESCALATED'
  | 'RUBRIC_ACTIVATED'
  | 'RUBRIC_UPDATED';

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get notifications for current user with pagination
 */
export async function getNotifications(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<NotificationPage>> {
  return apiClient.get<NotificationPage>(`/notifications?page=${page}&size=${size}`);
}

/**
 * Get unread notifications for current user
 */
export async function getUnreadNotifications(): Promise<ApiResponse<Notification[]>> {
  return apiClient.get<Notification[]>('/notifications/unread');
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<ApiResponse<number>> {
  return apiClient.get<number>('/notifications/unread/count');
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
  return apiClient.put<void>(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
  return apiClient.put<void>('/notifications/read-all');
}

/**
 * Create test notifications (for testing purposes)
 */
export async function createTestNotifications(): Promise<ApiResponse<any>> {
  return apiClient.post<any>('/notifications/test');
}

