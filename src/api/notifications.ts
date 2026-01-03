// API functions for notifications
import { authFetch } from '../utils/api';
import type { NotificationListResponse, UnreadCountResponse } from '../types/notifications';

/**
 * Fetch paginated notifications for the current user
 */
export async function getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
  return authFetch<NotificationListResponse>(`/notifications?page=${page}&limit=${limit}`);
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return authFetch<UnreadCountResponse>('/notifications/unread-count');
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: number): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>('/notifications/read-all', {
    method: 'POST',
  });
}
