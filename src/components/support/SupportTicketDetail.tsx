import { useState, useRef, useEffect } from "react";
import { X, Paperclip, Send, User, CheckCircle, ShieldCheck, Tag, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/features/support/support.types";
import {
  useSendReplyMutation,
  useCloseTicketMutation,
} from "@/API/support.api";
import { toast } from "sonner";
import { getStatusBadgeConfig, getPriorityBadgeConfig } from "./SupportTicketList";

interface SupportTicketDetailProps {
  ticket: SupportTicket;
}

export function SupportTicketDetail({ ticket }: SupportTicketDetailProps) {
  const [replyText, setReplyText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [sendReply, { isLoading: isSending }] = useSendReplyMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.id, ticket.messages.length]);

  const formatDate = (date?: Date | null) => {
    if (!date || isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !file) {
      toast.error("Please enter a message or attach a file.");
      return;
    }
    try {
      await sendReply({
        ticketId: ticket.id,
        content: replyText.trim(),
        file: file ?? undefined,
      }).unwrap();

      toast.success("Reply sent successfully");
      setReplyText("");
      setFile(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send reply");
    }
  };

  const handleCloseTicket = async () => {
    try {
      await closeTicket({ ticketId: ticket.id }).unwrap();
      toast.success("Ticket closed successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to close ticket");
    }
  };

  const statusConfig = getStatusBadgeConfig(ticket.status);
  const priorityConfig = getPriorityBadgeConfig(ticket.priority);
  const isTicketClosed = (ticket.status || "").toLowerCase() === "closed" || (ticket.status || "").toLowerCase() === "resolved";

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b bg-muted/15 shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
                {ticket.title}
              </h1>
              <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              {ticket.priority && (
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5", priorityConfig.className)}>
                  {priorityConfig.label} Priority
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/80 font-medium">
                #{ticket.ticketId}
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground/90">
                <User className="h-3.5 w-3.5 text-primary" />
                {ticket.clientName}
              </span>
              {ticket.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {ticket.category}
                </span>
              )}
              <span>Opened: {formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {ticket.assignedAgent && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span>Agent: {ticket.assignedAgent}</span>
              </div>
            )}

            <Button
              variant={isTicketClosed ? "outline" : "destructive"}
              size="sm"
              onClick={handleCloseTicket}
              disabled={isTicketClosed || isClosing}
              className="h-8 text-xs font-medium"
            >
              {isClosing ? "Closing..." : isTicketClosed ? "Closed" : "Close Ticket"}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <ScrollArea className="flex-1 px-6 py-5">
        <div className="space-y-5 w-full">
          {ticket.messages.map((message) => {
            const isClient = message.sender === "client";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[75%]",
                  isClient ? "mr-auto items-start" : "ml-auto items-end"
                )}
              >
                {/* Sender Header */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <span className="font-semibold text-foreground/90">
                    {message.senderName || (isClient ? ticket.clientName : ticket.assignedAgent || "Support Team")}
                  </span>
                  <span>•</span>
                  <span className="text-[11px]">{formatDate(message.createdAt)}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs border",
                    isClient
                      ? "bg-muted/60 text-foreground border-border/80 rounded-tl-xs"
                      : "bg-primary text-primary-foreground border-primary/20 rounded-tr-xs"
                  )}
                >
                  <p>{message.content}</p>

                  {/* Attachment Thumbnails */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {message.attachments.map((src, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveImage(src)}
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-border/40 bg-black/10"
                        >
                          <img
                            src={src}
                            alt="Attachment"
                            className="w-36 h-36 object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {ticket.messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No message history found for this ticket.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Image Viewer Lightbox Modal */}
      {activeImage && (
        <Dialog open={!!activeImage} onOpenChange={() => setActiveImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/90 border-none text-white shadow-2xl flex items-center justify-center">
            <img
              src={activeImage}
              alt="Attachment Full Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Footer Reply Form / Resolved Banner */}
      <div className="p-4 border-t bg-background shrink-0">
        {isTicketClosed ? (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3.5 shadow-xs">
            <div className="h-9 w-9 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-950 dark:text-purple-300 tracking-tight">
                This support ticket is resolved & closed
              </h4>
              <p className="text-[11px] text-purple-700/90 dark:text-purple-400 font-medium mt-0.5">
                This conversation is closed for new replies. No further actions required.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {file && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-xs w-fit">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Write a response to the client..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
                className="min-h-[70px] max-h-[140px] text-xs resize-none bg-background focus-visible:ring-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <label
                className={cn(
                  "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded transition-colors",
                  isSending && "pointer-events-none opacity-50"
                )}
              >
                <Paperclip className="h-4 w-4" />
                <span>Attach image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={isSending}
                />
              </label>

              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={isSending || (!replyText.trim() && !file)}
                className="h-8 px-4 text-xs font-semibold"
              >
                {isSending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
