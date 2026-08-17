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

// 📌 Admin Notification Catalog & Broadcast Types
export type NotificationSeverity = "INFORMATIONAL" | "ACTION_REQUIRED" | "CRITICAL";

export interface NotificationTemplate {
  title: string;
  description: string;
  severity: NotificationSeverity;
}

export interface NotificationCatalogResponse {
  userEvents: string[];
  systemEvents: string[];
  severities: NotificationSeverity[];
  templates: Record<string, NotificationTemplate>;
}

export interface BroadcastNotificationRequest {
  event:
    | "SCHEDULED_MAINTENANCE"
    | "TRADING_TEMPORARILY_UNAVAILABLE"
    | "DEPOSIT_SERVICE_UNAVAILABLE"
    | "WITHDRAWAL_SERVICE_UNAVAILABLE"
    | "MARKET_DATA_INTERRUPTION"
    | "TRADING_SYSTEM_ISSUE"
    | "SERVICE_RESTORED"
    | (string & {});
  title?: string;
  description?: string;
  severity?: NotificationSeverity;
  metadata?: Record<string, unknown>;
}

export interface BroadcastNotificationResponse {
  count: number;
  event: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
}

