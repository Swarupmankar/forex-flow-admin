// types/support.ts
export interface SupportReply {
  id: number;
  content: string;
  screenshot?: string;
  isBroker: boolean;
  isRead?: boolean;
  senderName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportUser {
  firstName: string;
  lastName: string;
  email?: string;
}

export interface SupportTicketApi {
  id: number;
  ticketId: string;
  subject: string;
  content: string;
  status: "OPEN" | "IN_PROGRESS" | "AWAITING_REPLY" | "RESOLVED" | "CLOSED";
  category?: string;
  priority?: string;
  assignedAgent?: string;
  hasUnreadAdminReply?: boolean;
  createdAt: string;
  updatedAt: string;
  screenshot?: string;
  user: SupportUser;
  replies?: SupportReply[];
}

export interface SupportTicketResponse {
  message: string;
  tickets: SupportTicketApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SupportMessage {
  id: number;
  ticketId: string;
  content: string;
  attachments?: string[];
  sender: "client" | "support";
  senderName: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: number;
  ticketId: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "awaiting_reply" | "resolved" | "closed" | string;
  category?: string;
  priority?: string;
  assignedAgent?: string;
  hasUnreadUserMessage?: boolean;
  clientName: string;
  createdAt: Date;
  updatedAt: Date;
  messages: SupportMessage[];
}
