// types/support.ts
export interface SupportReply {
  id: number;
  content: string;
  screenshot?: string;
  isBroker: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportUser {
  firstName: string;
  lastName: string;
}

export interface SupportTicketApi {
  id: number;
  ticketId: string;
  subject: string;
  content: string;
  status: "OPEN" | "CLOSED";
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
  status: "open" | "closed";
  clientName: string;
  createdAt: Date;
  updatedAt: Date;
  messages: SupportMessage[];
}
