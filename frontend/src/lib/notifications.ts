import { apiFetch } from "./api";

export interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(limit = 50, offset = 0): Promise<NotificationItem[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch<NotificationItem[]>(`/api/notifications/me?${params.toString()}`);
}

export async function getUnreadNotificationCount(): Promise<{ unread_count: number }> {
  return apiFetch<{ unread_count: number }>("/api/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiFetch("/api/notifications/me/read-all", { method: "PATCH" });
}
