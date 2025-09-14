import { Search, Filter } from "lucide-react";
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

const statusColors = {
  open: "bg-blue-500",
  closed: "bg-gray-500",
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
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Your Tickets</h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={clientFilter} onValueChange={onClientFilterChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All clients" />
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

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onTicketSelect(ticket)}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                selectedTicket?.id === ticket.id
                  ? "bg-primary/5 border-primary/20"
                  : "bg-background hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm leading-tight">
                  {ticket.title}
                </h3>
                <Badge
                  className={cn(
                    "ml-2 text-white text-xs",
                    statusColors[ticket.status]
                  )}
                >
                  {ticket.status}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatDate(ticket.createdAt)} • {ticket.clientName}
                </span>
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tickets found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
