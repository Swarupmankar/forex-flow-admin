import { useState } from "react";
import { X, Paperclip, Send } from "lucide-react";
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

interface SupportTicketDetailProps {
  ticket: SupportTicket;
}

const statusColors = {
  open: "bg-blue-500",
  closed: "bg-gray-500",
};

export function SupportTicketDetail({ ticket }: SupportTicketDetailProps) {
  const [replyText, setReplyText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [sendReply, { isLoading }] = useSendReplyMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();

  const formatDate = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return "N/A"; // ✅ safe fallback
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !file) {
      toast.error("Please enter a message or attach a file.");
      return;
    }
    try {
      const res = await sendReply({
        ticketId: ticket.id,
        content: replyText.trim(),
        file: file ?? undefined,
      }).unwrap();

      toast.success("Reply sent successfully");
      setReplyText("");
      setFile(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send reply");
    }
  };

  const handleCloseTicket = async () => {
    try {
      const res = await closeTicket({ ticketId: ticket.id }).unwrap();
      toast.success("Ticket closed successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to close ticket");
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border">
      {/* Header */}
      <div className="p-6 border-b shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold mb-2">
              {ticket.title} — {ticket.clientName}
            </h1>
            <h1 className="text-md  mb-2">Ticket ID - {ticket.ticketId}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Client • {formatDate(ticket.createdAt)},{" "}
                {formatTime(ticket.createdAt)}
              </span>
              <Badge className={cn("text-white", statusColors[ticket.status])}>
                {ticket.status}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleCloseTicket}
            disabled={ticket.status === "closed" || isClosing}
          >
            {isClosing ? "Closing..." : "Close Ticket"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {ticket.messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {message.sender === "client"
                    ? ticket.clientName
                    : "Support Team"}
                </span>
                <span className="text-muted-foreground">
                  {formatDate(message.createdAt)},{" "}
                  {formatTime(message.createdAt)}
                </span>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg max-w-[50%]",
                  message.sender === "client"
                    ? "bg-muted ml-0"
                    : "bg-primary/10 ml-auto"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {message.attachments.map((src, i) => (
                      <Dialog key={i}>
                        <DialogTrigger asChild>
                          <img
                            src={src}
                            alt="attachment"
                            className="w-32 h-32 object-cover rounded cursor-pointer border"
                          />
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
                          <img
                            src={src}
                            alt="full"
                            className="w-full h-auto max-h-[90vh] object-contain rounded"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <div className="p-6 border-t shrink-0">
        {ticket.status === "closed" ? (
          <div className="text-center text-sm text-muted-foreground">
            This ticket has been closed. You cannot send further messages.
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Paperclip className="h-4 w-4 mr-2" />
                      {file ? "Change File" : "Choose File"}
                    </span>
                  </Button>
                </label>
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>

              <Button
                onClick={handleSendReply}
                disabled={isLoading || (!replyText.trim() && !file)}
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
