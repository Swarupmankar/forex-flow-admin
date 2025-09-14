import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsFilters } from "@/components/clients/ClientsFilters";
import { Client } from "@/features/users/users.types";
import { useListUsersQuery } from "@/API/users.api";

function mapKycStatus(apiStatus: string): Client["kycStatus"] {
  const M: Record<string, Client["kycStatus"]> = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  };
  return M[apiStatus?.toUpperCase()] ?? "pending";
}

function apiUserToClient(u: {
  id: string;
  name: string;
  email: string;
  accountId: number;
  kycStatus: string;
  walletBalance: number;
  linkedTradingAccounts: number;

  registrationDate: string;
  accounts?: any[]; // Add this if needed for type inference
}): Client {
  return {
    id: u.accountId,
    name: u.name,
    email: u.email,
    accountId: u.accountId,
    kycStatus: mapKycStatus(u.kycStatus),
    walletBalance: Number(u.walletBalance),
    linkedAccounts: u.linkedTradingAccounts,
    linkedTradingAccounts: u.linkedTradingAccounts,
    registrationDate: u.registrationDate,
    accounts: u.accounts ?? [], // Provide a default empty array if not present
  };
}

const Clients = () => {
  const navigate = useNavigate();
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    kycStatus: "all",
    registrationDate: "all",
    accountType: "all",
  });

  // Fetch from API (first page; adjust if you add pagination UI)
  const { data, isLoading, isFetching, isError, error, refetch } =
    useListUsersQuery(
      { page: 1, limit: 50 },
      {
        pollingInterval: 5000, // auto-update every 5s
        refetchOnFocus: true,
        refetchOnReconnect: true,
        refetchOnMountOrArgChange: true,
      }
    );

  const mapped = useMemo(
    () =>
      (
        (data?.results ?? []) as unknown as Array<
          Parameters<typeof apiUserToClient>[0]
        >
      ).map(apiUserToClient),
    [data]
  );
  const [clients, setClients] = useState<Client[]>(mapped);

  useEffect(() => {
    setClients(mapped);
  }, [mapped]);

  const handleViewClient = (client: Client) => {
    const id = client.id ?? String(client.accountId);
    navigate(`/clients/${id}`);
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAllClients = (checked: boolean) => {
    setSelectedClients(checked ? filteredClients.map((c) => c.id) : []);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for clients:`, selectedClients);
    setSelectedClients([]);
  };

  // Filter clients based on search and filters
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      searchQuery === "" ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(client.accountId)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesKyc =
      filters.kycStatus === "all" || client.kycStatus === filters.kycStatus;

    return matchesSearch && matchesKyc;
  });

  return (
    <DashboardLayout title="Clients">
      <div className="space-y-6">
        <ClientsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <ClientsFilters
          filters={filters}
          onFiltersChange={setFilters}
          selectedCount={selectedClients.length}
          onBulkAction={handleBulkAction}
        />

        {isError ? (
          <div className="bg-destructive/10 text-destructive border border-destructive/30 p-4 rounded">
            Failed to load clients:{" "}
            {String((error as any)?.status ?? "Unknown error")}
          </div>
        ) : (
          <ClientsTable
            clients={filteredClients}
            selectedClients={selectedClients}
            onSelectClient={handleSelectClient}
            onSelectAll={handleSelectAllClients}
            onViewClient={handleViewClient}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
