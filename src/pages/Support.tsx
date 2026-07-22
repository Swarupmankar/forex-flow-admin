import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";
import { useGetTicketByIdQuery, useGetTicketsQuery } from "@/API/support.api";
import { SupportTicket } from "@/features/support/support.types";
import { useSupportSocket } from "@/hooks/useSupportSocket";

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

  const { data: ticketDetail, refetch: refetchTicketDetail } = useGetTicketByIdQuery(selectedTicketId!, {
    skip: !selectedTicketId,
  });

  // ✅ Real-time Support WebSocket
  useSupportSocket({
    brokerId: 1,
    ticketId: selectedTicketId ?? undefined,
    onNewReply: useCallback(() => {
      refetchTickets();
      if (selectedTicketId) refetchTicketDetail();
    }, [refetchTickets, refetchTicketDetail, selectedTicketId]),
    onNewTicket: useCallback(() => {
      refetchTickets();
    }, [refetchTickets]),
    onStatusChange: useCallback(() => {
      refetchTickets();
      if (selectedTicketId) refetchTicketDetail();
    }, [refetchTickets, refetchTicketDetail, selectedTicketId]),
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

  console.log("[Support] Fetching ticket detail with id:", selectedTicketId);

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
    if (mapped.status === "open") {
      console.log("[Support] Selected OPEN ticket:", mapped);
    }

    return mapped;
  }, [ticketDetail]);

  return (
    <DashboardLayout title="Support Center">
      <div className="h-[calc(100vh-7rem)] flex gap-5 overflow-hidden">
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
            <div className="h-full flex items-center justify-center text-muted-foreground rounded-xl border bg-card">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
