import { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { format, formatDistanceToNow, isSameDay, isToday, isYesterday } from "date-fns";
import {
  X,
  Paperclip,
  Send,
  CheckCircle,
  ShieldCheck,
  Tag,
  Eye,
  Clock,
  Headset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/features/support/support.types";
import { useSendReplyMutation, useCloseTicketMutation } from "@/API/support.api";
import {
  useGetCryptoWithdrawFeeQuery,
  useGetIbMinWithdrawQuery,
} from "@/API/cryptoRails.api";
import type { TemplateVars } from "@/features/support/replyTemplates";
import { toast } from "sonner";
import { getStatusBadgeConfig, getPriorityBadgeConfig, categoryLabel, initialsOf } from "./SupportTicketList";
import { ReplyTemplatePicker } from "./ReplyTemplatePicker";

interface SupportTicketDetailProps {
  ticket: SupportTicket;
}

type AuthUser = { name?: string | null; username?: string | null } | null;

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const dayLabel = (d: Date) =>
  isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE, dd MMM yyyy");

const validDate = (d?: Date | null): d is Date => !!d && !isNaN(d.getTime());

export function SupportTicketDetail({ ticket }: SupportTicketDetailProps) {
  const [replyText, setReplyText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [sendReply, { isLoading: isSending }] = useSendReplyMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();

  // Live broker settings, so templates quote what the platform actually charges.
  const { data: feeData } = useGetCryptoWithdrawFeeQuery();
  const { data: minData } = useGetIbMinWithdrawQuery();
  const broker = useSelector((s: { auth: { user: AuthUser } }) => s.auth.user);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.id, ticket.messages.length]);

  // A draft belongs to the ticket it was written for.
  useEffect(() => {
    setReplyText("");
    setFile(null);
  }, [ticket.id]);

  const templateVars: TemplateVars = useMemo(
    () => ({
      clientName: ticket.clientName.split(" ")[0] || "there",
      ticketId: ticket.ticketId,
      agentName: ticket.assignedAgent || "Support Team",
      // Reads as "contacting our platform support" when no name is set.
      brokerName: broker?.name || broker?.username || "our platform",
      cryptoWithdrawFee: feeData ? usd(feeData.cryptoWithdrawFee) : "the published fee",
      ibMinWithdraw: minData ? usd(minData.ibMinWithdraw) : "the published minimum",
    }),
    [ticket.clientName, ticket.ticketId, ticket.assignedAgent, broker, feeData, minData]
  );

  const insertTemplate = (text: string) => {
    const previous = replyText;
    setReplyText(text);
    if (previous.trim()) {
      toast("Template replaced your draft", {
        action: { label: "Undo", onClick: () => setReplyText(previous) },
      });
    }
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

      toast.success("Reply sent");
      setReplyText("");
      setFile(null);
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || "Failed to send reply");
    }
  };

  const handleCloseTicket = async () => {
    try {
      await closeTicket({ ticketId: ticket.id }).unwrap();
      toast.success("Ticket closed");
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || "Failed to close ticket");
    }
  };

  const statusConfig = getStatusBadgeConfig(ticket.status);
  const priorityConfig = getPriorityBadgeConfig(ticket.priority);
  const status = (ticket.status || "").toLowerCase();
  const isTicketClosed = status === "closed" || status === "resolved";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initialsOf(ticket.clientName)}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {ticket.title}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] font-semibold", statusConfig.className)}>
                  {statusConfig.label}
                </Badge>
                {ticket.priority && (
                  <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", priorityConfig.className)}>
                    {priorityConfig.label} priority
                  </Badge>
                )}
                {ticket.category && (
                  <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {categoryLabel(ticket.category)}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground/90">{ticket.clientName}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono">#{ticket.ticketId}</span>
                {validDate(ticket.createdAt) && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Opened {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {ticket.assignedAgent && (
              <div className="hidden items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary sm:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ticket.assignedAgent}
              </div>
            )}
            <Button
              variant={isTicketClosed ? "outline" : "destructive"}
              size="sm"
              onClick={handleCloseTicket}
              disabled={isTicketClosed || isClosing}
              className="h-7 px-2.5 text-[11px] font-medium"
            >
              {isClosing ? "Closing..." : isTicketClosed ? "Closed" : "Close ticket"}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/10 px-5 py-4">
        <div className="w-full space-y-3">
          {ticket.messages.map((message, i) => {
            const isClient = message.sender === "client";
            const prev = ticket.messages[i - 1];
            const showDay =
              validDate(message.createdAt) &&
              (!prev || !validDate(prev.createdAt) || !isSameDay(prev.createdAt, message.createdAt));
            const name =
              message.senderName || (isClient ? ticket.clientName : ticket.assignedAgent || "Support Team");

            return (
              <div key={message.id} className="space-y-3">
                {showDay && (
                  <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    {dayLabel(message.createdAt)}
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div className={cn("flex items-end gap-2", isClient ? "justify-start" : "flex-row-reverse")}>
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isClient ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    )}
                    title={name}
                  >
                    {isClient ? initialsOf(name) : <Headset className="h-3.5 w-3.5" />}
                  </div>

                  <div className={cn("flex max-w-[80%] flex-col gap-1 sm:max-w-[70%]", isClient ? "items-start" : "items-end")}>
                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{name}</span>
                      {validDate(message.createdAt) && <span>· {format(message.createdAt, "HH:mm")}</span>}
                    </div>
                    <div
                      className={cn(
                        "whitespace-pre-wrap break-words rounded-2xl border px-3 py-2 text-xs leading-relaxed shadow-sm",
                        isClient
                          ? "rounded-bl-sm border-border/80 bg-card text-foreground"
                          : "rounded-br-sm border-primary/20 bg-primary text-primary-foreground"
                      )}
                    >
                      {message.content && <p>{message.content}</p>}

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachments.map((src, j) => (
                            <button
                              key={j}
                              type="button"
                              onClick={() => setActiveImage(src)}
                              className="group relative overflow-hidden rounded-lg border border-border/40 bg-black/10"
                            >
                              <img
                                src={src}
                                alt="Attachment"
                                className="h-28 w-28 object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <Eye className="h-5 w-5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {ticket.messages.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No messages on this ticket yet.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {activeImage && (
        <Dialog open={!!activeImage} onOpenChange={() => setActiveImage(null)}>
          <DialogContent className="flex max-w-4xl items-center justify-center border-none bg-black/90 p-2 text-white shadow-2xl">
            <img
              src={activeImage}
              alt="Attachment full preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Composer */}
      <div className="shrink-0 border-t bg-background p-3">
        {isTicketClosed ? (
          <div className="flex items-center gap-3.5 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-purple-950 dark:text-purple-300">
                This ticket is resolved & closed
              </h4>
              <p className="mt-0.5 text-[11px] font-medium text-purple-700/90 dark:text-purple-400">
                The conversation is closed for new replies.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <ReplyTemplatePicker
              category={ticket.category}
              vars={templateVars}
              onInsert={insertTemplate}
              disabled={isSending}
            />

            <div className="rounded-xl border bg-background focus-within:ring-1 focus-within:ring-primary/40">
              <Textarea
                placeholder="Write a reply… (Ctrl + Enter to send)"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                disabled={isSending}
                className="max-h-[160px] min-h-[60px] resize-none border-0 text-xs shadow-none focus-visible:ring-0"
              />

              <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
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
                  {file && (
                    <span className="flex min-w-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      <span className="truncate font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove attachment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={isSending || (!replyText.trim() && !file)}
                  className="h-7 px-3 text-[11px] font-semibold"
                >
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Send reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
