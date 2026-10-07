import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";
import { useGetTicketByIdQuery, useGetTicketsQuery } from "@/API/support.api";
import { SupportTicket } from "@/features/support/support.types";
import { useSupportSocket } from "@/hooks/useSupportSocket";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Inbox,
  Loader,
  MessageCircleWarning,
  MessagesSquare,
  CircleDot,
} from "lucide-react";

const STATUS_CARDS = [
  { key: "all", label: "All tickets", icon: Inbox, tone: "bg-primary/10 text-primary" },
  { key: "open", label: "Open", icon: CircleDot, tone: "bg-emerald-100 text-emerald-600" },
  { key: "awaiting_reply", label: "Awaiting reply", icon: MessageCircleWarning, tone: "bg-amber-100 text-amber-600" },
  { key: "in_progress", label: "In progress", icon: Loader, tone: "bg-blue-100 text-blue-600" },
  { key: "resolved", label: "Resolved", icon: CheckCircle2, tone: "bg-purple-100 text-purple-600" },
] as const;

export default function Support() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketParam = searchParams.get("ticket");
  const selectedTicketId = ticketParam ? Number(ticketParam) : null;

  const setSelectedTicketId = useCallback(
    (id: number | null) => {
      if (id) {
        setSearchParams({ ticket: id.toString() }, { replace: false });
      } else {
        setSearchParams({}, { replace: false });
      }
    },
    [setSearchParams]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  // ✅ Fetch tickets from API
  const { data, isLoading, refetch: refetchTickets } = useGetTicketsQuery({
    status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
  });

  // Unfiltered, for the status counts. Same cache entry as the list when the
  // filter is "all".
  const { data: allData, refetch: refetchAll } = useGetTicketsQuery({});

  const { data: ticketDetail, refetch: refetchTicketDetail } = useGetTicketByIdQuery(selectedTicketId!, {
    skip: !selectedTicketId,
  });

  const counts = useMemo(() => {
    const c = { all: 0, open: 0, awaiting_reply: 0, in_progress: 0, resolved: 0 };
    for (const t of allData?.tickets ?? []) {
      c.all += 1;
      const s = (t.status ?? "OPEN").toLowerCase() as keyof typeof c;
      if (s in c) c[s] += 1;
    }
    return c;
  }, [allData]);

  // ✅ Real-time Support WebSocket
  useSupportSocket({
    brokerId: 1,
    ticketId: selectedTicketId ?? undefined,
    onNewReply: useCallback(() => {
      refetchTickets();
      refetchAll();
      if (selectedTicketId) refetchTicketDetail();
    }, [refetchTickets, refetchAll, refetchTicketDetail, selectedTicketId]),
    onNewTicket: useCallback(() => {
      refetchTickets();
      refetchAll();
    }, [refetchTickets, refetchAll]),
    onStatusChange: useCallback(() => {
      refetchTickets();
      refetchAll();
      if (selectedTicketId) refetchTicketDetail();
    }, [refetchTickets, refetchAll, refetchTicketDetail, selectedTicketId]),
  });

  const tickets = data?.tickets ?? [];

  // ✅ Map API → UI type
  const mappedTickets: SupportTicket[] = useMemo(
    () =>
      tickets.map((t) => ({
        id: t.id,
        ticketId: t.ticketId,
        title: t.subject,
        description: t.content,
        status: (t.status ?? "OPEN").toLowerCase(),
        category: t.category,
        priority: t.priority,
        assignedAgent: t.assignedAgent,
        hasUnreadUserMessage: (t.status ?? "").toUpperCase() === "AWAITING_REPLY",
        clientName: `${t.user?.firstName || "Client"} ${t.user?.lastName || ""}`.trim(),
        createdAt: t.createdAt ? new Date(t.createdAt) : null,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
        messages: (t.replies ?? []).map((r) => ({
          id: r.id,
          ticketId: t.id.toString(),
          content: r.content,
          attachments: r.screenshot ? [r.screenshot] : [],
          sender: r.isBroker ? "support" : "client",
          senderName: r.isBroker
            ? (r as any).senderName || t.assignedAgent || "Support Team"
            : t.user
            ? `${t.user.firstName} ${t.user.lastName}`
            : "Client",
          createdAt: new Date(r.createdAt),
        })),
      })),
    [tickets]
  );

  // ✅ Apply filters client-side
  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mappedTickets.filter((ticket) => {
      const matchesSearch =
        (ticket.title ?? "").toLowerCase().includes(q) ||
        (ticket.description ?? "").toLowerCase().includes(q) ||
        (ticket.clientName ?? "").toLowerCase().includes(q) ||
        (ticket.ticketId ?? "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter.toLowerCase();

      const matchesClient =
        clientFilter === "all" || ticket.clientName === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [mappedTickets, searchQuery, statusFilter, clientFilter]);


  const selectedTicket: SupportTicket | null = useMemo(() => {
    if (!ticketDetail) return null;

    const mapped: SupportTicket = {
      id: ticketDetail.id,
      ticketId: ticketDetail.ticketId,
      title: ticketDetail.subject,
      description: ticketDetail.content,
      status: (ticketDetail.status ?? "OPEN").toLowerCase(),
      category: ticketDetail.category,
      priority: ticketDetail.priority,
      assignedAgent: ticketDetail.assignedAgent,
      hasUnreadUserMessage: (ticketDetail.status ?? "").toUpperCase() === "AWAITING_REPLY",
      clientName: `${ticketDetail.user?.firstName || "Client"} ${ticketDetail.user?.lastName || ""}`.trim(),
      createdAt: ticketDetail.createdAt
        ? new Date(ticketDetail.createdAt)
        : null,
      updatedAt: ticketDetail.updatedAt
        ? new Date(ticketDetail.updatedAt)
        : null,
      messages: (ticketDetail.replies ?? []).map((r) => ({
        id: r.id,
        ticketId: ticketDetail.id.toString(),
        content: r.content,
        attachments: r.screenshot ? [r.screenshot] : [],
        sender: r.isBroker ? "support" : "client",
        senderName: r.isBroker
          ? (r as any).senderName || ticketDetail.assignedAgent || "Support Team"
          : ticketDetail.user
          ? `${ticketDetail.user.firstName} ${ticketDetail.user.lastName}`
          : "Client",
        createdAt: new Date(r.createdAt),
      })),
    };

    return mapped;
  }, [ticketDetail]);

  return (
    <DashboardLayout title="Support Center">
      <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 overflow-hidden">
        {/* Status counts, each a filter */}
        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_CARDS.map((card) => {
            const active = statusFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(card.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left transition-all hover:shadow-sm",
                  active && "border-primary/50 ring-1 ring-primary/30"
                )}
              >
                <div className={cn("rounded-md p-1.5", card.tone)}>
                  <card.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-base font-bold leading-none text-foreground">
                    {counts[card.key as keyof typeof counts]}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-hidden">
        {/* Left Side: Fixed Support Tickets Sidebar */}
        <div className="w-[320px] sm:w-[360px] lg:w-[380px] shrink-0 h-full flex flex-col">
          <SupportTicketList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            onTicketSelect={(ticket) => {
              setSelectedTicketId(ticket.id);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            clientFilter={clientFilter}
            onClientFilterChange={setClientFilter}
            clients={Array.from(
              new Set(mappedTickets.map((t) => t.clientName))
            )}
          />
        </div>

        {/* Right Side: Movable & Scrollable Chat Detail View */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground rounded-xl border bg-card">
              Loading tickets...
            </div>
          ) : selectedTicket ? (
            <SupportTicketDetail ticket={selectedTicket} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border bg-card text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MessagesSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Select a ticket</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Pick a conversation from the list. Quick-reply templates for its
                  category will be ready in the reply box.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
