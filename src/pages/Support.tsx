import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { SupportTicketDetail } from "@/components/support/SupportTicketDetail";
import { useGetTicketByIdQuery, useGetTicketsQuery } from "@/API/support.api";
import { SupportTicket } from "@/features/support/support.types";

export default function Support() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  // ✅ Fetch tickets from API
  const { data, isLoading } = useGetTicketsQuery({
    status: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
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
        status: (t.status ?? "OPEN").toLowerCase() as "open" | "closed",
        clientName: `${t.user.firstName} ${t.user.lastName}`.trim(),
        createdAt: t.createdAt ? new Date(t.createdAt) : null,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : null,
        messages: (t.replies ?? []).map((r) => ({
          id: r.id,
          ticketId: t.id.toString(),
          content: r.content,
          attachments: r.screenshot ? [r.screenshot] : [],
          sender: r.isBroker ? "support" : "client",
          senderName: r.isBroker
            ? "Support Team"
            : t.user
            ? `${t.user.firstName} ${t.user.lastName}`
            : "Unknown Client",
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
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesClient =
        clientFilter === "all" || ticket.clientName === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [mappedTickets, searchQuery, statusFilter, clientFilter]);

  console.log("[Support] Fetching ticket detail with id:", selectedTicketId);
  // ✅ Fetch selected ticket details (fresh data)
  const { data: ticketDetail } = useGetTicketByIdQuery(selectedTicketId!, {
    skip: !selectedTicketId,
  });

  const selectedTicket: SupportTicket | null = useMemo(() => {
    if (!ticketDetail) return null;

    const mapped: SupportTicket = {
      id: ticketDetail.id,
      ticketId: ticketDetail.ticketId,
      title: ticketDetail.subject,
      description: ticketDetail.content,
      status: (ticketDetail.status ?? "OPEN").toLowerCase() as
        | "open"
        | "closed",
      clientName:
        `${ticketDetail.user.firstName} ${ticketDetail.user.lastName}`.trim(),
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
          ? "Support Team"
          : ticketDetail.user
          ? `${ticketDetail.user.firstName} ${ticketDetail.user.lastName}`
          : "Unknown Client",
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
      <div className="h-full flex gap-6">
        <div className="w-1/3 min-w-0">
          <SupportTicketList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            onTicketSelect={(ticket) => {
              console.log(
                "[Support] Ticket clicked, id:",
                ticket.id,
                "ticketId:",
                ticket.ticketId
              );
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

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Loading tickets...
            </div>
          ) : selectedTicket ? (
            <SupportTicketDetail ticket={selectedTicket} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a ticket to view details
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
