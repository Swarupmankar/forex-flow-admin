import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Search, MessageSquare, AlertCircle, Headset } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/features/support/support.types";
import { TEMPLATE_CATEGORY_LABEL } from "@/features/support/replyTemplates";

interface SupportTicketListProps {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  onTicketSelect: (ticket: SupportTicket) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  clientFilter: string;
  onClientFilterChange: (client: string) => void;
  clients: string[];
}

export const getStatusBadgeConfig = (status?: string) => {
  const normalized = (status || "").toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case "open":
      return { label: "Open", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" };
    case "in-progress":
      return { label: "In Progress", className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" };
    case "awaiting-reply":
    case "awaiting":
      return { label: "Awaiting Reply", className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 font-semibold" };
    case "resolved":
      return { label: "Resolved", className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" };
    case "closed":
      return { label: "Closed", className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400" };
    default:
      return { label: status || "Open", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" };
  }
};

export const getPriorityBadgeConfig = (priority?: string) => {
  const normalized = (priority || "").toLowerCase();
  switch (normalized) {
    case "high":
      return { label: "High", className: "bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold" };
    case "medium":
      return { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    case "low":
    default:
      return { label: "Low", className: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
  }
};

export const categoryLabel = (category?: string) =>
  TEMPLATE_CATEGORY_LABEL[(category ?? "").toUpperCase() as keyof typeof TEMPLATE_CATEGORY_LABEL] ??
  category ??
  "";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const isAwaiting = (t: SupportTicket) =>
  (t.status || "").toLowerCase().includes("awaiting") || !!t.hasUnreadUserMessage;

const ago = (d: Date | null) =>
  d && !isNaN(d.getTime()) ? formatDistanceToNowStrict(d, { addSuffix: true }) : "";

export function SupportTicketList({
  tickets,
  selectedTicket,
  onTicketSelect,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  clientFilter,
  onClientFilterChange,
  clients,
}: SupportTicketListProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = tickets.filter(
    (t) => priorityFilter === "all" || (t.priority || "").toLowerCase() === priorityFilter
  );

  const awaitingCount = tickets.filter(isAwaiting).length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="space-y-3 border-b bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Tickets</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {filteredTickets.length}
            </span>
          </div>
          {awaitingCount > 0 && (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              {awaitingCount} need reply
            </Badge>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject, client or ticket ID…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 bg-background pl-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-8 bg-background text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="awaiting_reply">Awaiting reply</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 bg-background text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={onClientFilterChange}>
            <SelectTrigger className="h-8 bg-background text-xs">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-1.5 p-2">
          {filteredTickets.map((ticket) => {
            const statusConfig = getStatusBadgeConfig(ticket.status);
            const priorityConfig = getPriorityBadgeConfig(ticket.priority);
            const isSelected = selectedTicket?.id === ticket.id;
            const awaiting = isAwaiting(ticket);
            const last = ticket.messages[ticket.messages.length - 1];
            const preview = last?.content || ticket.description;
            const lastAt = last?.createdAt ?? ticket.updatedAt ?? ticket.createdAt;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onTicketSelect(ticket)}
                className={cn(
                  "relative w-full min-w-0 overflow-hidden rounded-lg border p-2.5 text-left transition-all duration-150",
                  isSelected
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-transparent hover:border-border hover:bg-muted/40"
                )}
              >
                {awaiting && !isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-amber-500" />
                )}
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {initialsOf(ticket.clientName)}
                    </div>
                    {awaiting && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-amber-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-xs", awaiting ? "font-bold" : "font-semibold")}>
                        {ticket.clientName}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{ago(lastAt)}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-foreground/90">{ticket.title}</p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      {last?.sender === "support" && <Headset className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{preview}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", statusConfig.className)}>
                        {statusConfig.label}
                      </Badge>
                      {ticket.priority && (
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", priorityConfig.className)}>
                          {priorityConfig.label}
                        </Badge>
                      )}
                      {ticket.category && (
                        <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                          {categoryLabel(ticket.category)}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        #{ticket.ticketId}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="space-y-2 px-4 py-12 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
              <p className="text-xs text-muted-foreground/60">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
