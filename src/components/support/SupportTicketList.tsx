import { useState } from "react";
import { Search, MessageSquare, Clock, User, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/features/support/support.types";

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
    case "in_progress":
      return { label: "In Progress", className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" };
    case "awaiting-reply":
    case "awaiting_reply":
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

  const formatDate = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter === "all") return true;
    return (t.priority || "").toLowerCase() === priorityFilter;
  });

  const awaitingCount = tickets.filter(
    (t) => (t.status || "").toLowerCase().includes("awaiting") || t.hasUnreadUserMessage
  ).length;

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header & Stats */}
      <div className="p-4 border-b bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold tracking-tight">Support Tickets</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              {tickets.length}
            </span>
          </div>
          {awaitingCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[11px] animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              {awaitingCount} Need Reply
            </Badge>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tickets, clients, IDs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_reply">Awaiting Reply</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={onClientFilterChange}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket List Items */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredTickets.map((ticket) => {
            const statusConfig = getStatusBadgeConfig(ticket.status);
            const priorityConfig = getPriorityBadgeConfig(ticket.priority);
            const isSelected = selectedTicket?.id === ticket.id;
            const isAwaitingReply =
              (ticket.status || "").toLowerCase().includes("awaiting") || ticket.hasUnreadUserMessage;

            return (
              <div
                key={ticket.id}
                onClick={() => onTicketSelect(ticket)}
                className={cn(
                  "p-3.5 rounded-lg border text-left cursor-pointer transition-all duration-150 relative",
                  isSelected
                    ? "bg-primary/5 border-primary/40 shadow-sm"
                    : "bg-background hover:bg-muted/40 border-border/60",
                  isAwaitingReply && !isSelected && "border-l-4 border-l-amber-500"
                )}
              >
                {/* Header: Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {ticket.title}
                      </span>
                      {isAwaitingReply && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{ticket.ticketId}
                    </span>
                  </div>

                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", statusConfig.className)}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Description Snippet */}
                <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-2 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Meta details footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate font-medium text-foreground/80">{ticket.clientName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ticket.assignedAgent && (
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
                        {ticket.assignedAgent}
                      </span>
                    )}
                    {ticket.priority && (
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", priorityConfig.className)}>
                        {priorityConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
              <p className="text-xs text-muted-foreground/60">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
