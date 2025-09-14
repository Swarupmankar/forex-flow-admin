import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, MessageSquare, Eye, Reply } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Client,
  CustomMessagePayload,
  CustomMessageItem,
} from "@/features/users/users.types";
import {
  useGetCustomMessageHistoryQuery,
  useSendCustomMessageMutation,
} from "@/API/users.api";
import { Input } from "../ui/input";

interface CustomMessageProps {
  client: Client;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateAndTime(iso?: string | null) {
  if (!iso) return { date: "Unknown date", time: "" };
  try {
    const d = new Date(iso);
    // Date: DD/MM/YYYY (en-GB). Time: HH:mm 24-hour (en-GB, hour12: false)
    const date = d.toLocaleDateString("en-GB");
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: "Unknown date", time: "" };
  }
}

function TypeBadge({ type }: { type?: string | null }) {
  const t = (type ?? "UNKNOWN").toUpperCase();

  const base = "px-2 py-0.5 rounded-full text-xs font-medium";

  const map: Record<string, string> = {
    SECURITY: `${base} bg-destructive/10 text-destructive border border-destructive/20`,
    UPDATE: `${base} bg-primary/10 text-primary border border-primary/20`,
    PROMOTION: `${base} bg-success/10 text-success border border-success/20`,
    ALERT: `${base} bg-warning/10 text-warning border border-warning/20`,
    MAINTENANCE: `${base} bg-muted/10 text-muted border border-muted/20`,
    UNKNOWN: `${base} bg-muted/10 text-muted border border-muted/20`,
  };

  const className = map[t] ?? map.UNKNOWN;

  return <Badge className={className}>{t}</Badge>;
}

export function CustomMessage({ client }: CustomMessageProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("general");
  const [messageType, setMessageType] = useState<
    "SECURITY" | "UPDATE" | "PROMOTION" | "ALERT" | "MAINTENANCE"
  >("ALERT");
  const [sendCustomMessage, { isLoading: isSending }] =
    useSendCustomMessageMutation();

  const {
    data: history,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useGetCustomMessageHistoryQuery(client.id, {
    skip: !client?.id,
    refetchOnFocus: true,
  });

  const [optimisticMessages, setOptimisticMessages] = useState<
    CustomMessageItem[]
  >([]);

  const { toast } = useToast();

  const messageTemplates = {
    welcome:
      "Welcome to our trading platform! Your account has been successfully set up and verified.",
    kyc_approved:
      "Congratulations! Your KYC verification has been approved. You can now access all platform features.",
    kyc_rejected:
      "We need additional information for your KYC verification. Please resubmit your documents.",
    withdrawal_approved:
      "Your withdrawal request has been approved and will be processed within 1-2 business days.",
    general: "",
  };

  useEffect(() => {
    if (history && history.length > 0) {
      setOptimisticMessages([]);
    }
  }, [history]);

  useEffect(() => {
    if (template && messageTemplates[template] !== undefined) {
      setMessage(messageTemplates[template]);
    }
  }, [template]);

  const handleSendMessage = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please add a title." });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please add a message.",
      });
      return;
    }

    const payload: CustomMessagePayload = {
      userId: client.id,
      title: title.trim(),
      message: message.trim(),
      type: messageType,
    };

    try {
      // immediately add to optimistic list for snappy UI
      const optimistic: CustomMessageItem = {
        id: `local-${Date.now()}`,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        userId: client.id,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((s) => [optimistic, ...s]);

      // call mutation (will invalidate tags and refetch history)
      const result = await sendCustomMessage(payload).unwrap();

      toast({
        title: "Message sent",
        description: `Message sent to ${client.name}.`,
      });

      // If backend returns created object, optionally update optimistic id or leave as-is
      // We'll rely on the subsequent history refetch to show canonical data, and we clear optimistics on history change.
    } catch (err: any) {
      // remove last optimistic message if server failed (simple approach)
      setOptimisticMessages((s) => s.slice(1));
      toast({
        title: "Failed to send",
        description:
          err?.data?.message ?? err?.message ?? "Could not send message.",
      });
    } finally {
      setTitle("");
      setMessage("");
      setTemplate("general");
    }
  };

  // combine optimistic messages + server history for display; optimistic first
  const displayedMessages = useMemo<CustomMessageItem[]>(
    () => [...optimisticMessages, ...(history ?? client.customMessages ?? [])],
    [optimisticMessages, history, client.customMessages]
  );

  return (
    <div className="space-y-6">
      {/* Send New Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message to {client.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-1 md:col-span-1"
            />

            <div className="col-span-1 md:col-span-1">
              <Select
                value={messageType}
                onValueChange={(value) =>
                  setMessageType(
                    value as
                      | "SECURITY"
                      | "UPDATE"
                      | "PROMOTION"
                      | "ALERT"
                      | "MAINTENANCE"
                  )
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SECURITY">SECURITY</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="PROMOTION">PROMOTION</SelectItem>
                  <SelectItem value="ALERT">ALERT</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-1">
              <Select
                value={template}
                onValueChange={(value) => {
                  setTemplate(value);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Custom Message</SelectItem>
                  <SelectItem value="welcome">Welcome Message</SelectItem>
                  <SelectItem value="kyc_approved">KYC Approved</SelectItem>
                  <SelectItem value="kyc_rejected">KYC Rejected</SelectItem>
                  <SelectItem value="withdrawal_approved">
                    Withdrawal Approved
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading || historyFetching ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading messages…
            </div>
          ) : displayedMessages.length > 0 ? (
            <div className="space-y-4">
              {displayedMessages.map((msg) => {
                const { date, time } = formatDateAndTime(
                  msg.createdAt ?? msg.date ?? null
                );
                return (
                  <div key={String(msg.id)} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {msg.title ? (
                          <h4 className="text-sm font-medium mb-1">
                            {msg.title}
                          </h4>
                        ) : null}
                        <p className="text-sm text-foreground mb-2">
                          {msg.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Sent by {msg.sentBy ?? "Admin"}</span>
                          <span>•</span>
                          <span>{date}</span>
                          <span>•</span>
                          <span>{time}</span>
                        </div>
                      </div>

                      <div className="ml-4">
                        <TypeBadge type={msg.type} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No messages sent to this client yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
