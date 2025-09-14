// features/notifications/notifications.types.ts

export interface Notification {
  id: number;
  title: string;
  description: string;
  fileAttachedUrl?: string;
  targetAudience: "ACTIVE_CLIENTS" | "INACTIVE_CLIENTS";
  type: "SECURITY" | "ALERT" | "UPDATE" | "PROMOTION" | "MAINTENANCE";
  brokerId: number;
  createdAt: string;
  updatedAt: string;
  file?: File | null;
  attachments?: {
    name: string;
    type: string;
    size: string;
  }[];
}

// For GET all notifications
export type GetNotificationsResponse = Notification[];

// For CREATE / UPDATE (using FormData)
export interface CreateNotificationRequest {
  file?: File | null;
  title: string;
  description: string;
  targetAudience: string;
  type: string;
}
export interface CreateNotificationResponse {
  message: string;
  notification: Notification;
}

export interface UpdateNotificationRequest extends CreateNotificationRequest {
  id: number;
}
export interface UpdateNotificationResponse {
  message: string;
  notification: Notification;
}

export interface DeleteNotificationResponse {
  message: string;
}
