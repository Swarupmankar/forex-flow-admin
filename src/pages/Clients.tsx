import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  Download,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsToolbar } from "@/components/clients/ClientsToolbar";
import { useGetAllUsersQuery, useSetUserActiveMutation } from "@/API/users.api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  DEFAULT_CLIENT_FILTERS,
  applyClientFilters,
  toClientRow,
  type ClientFilters,
  type ClientListItemApi,
  type ClientRow,
} from "@/features/users/clientList";
import { exportToCSV, generateExportFilename } from "@/lib/export-utils";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const Clients = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS);
  const [banTarget, setBanTarget] = useState<ClientRow | null>(null);
  const [setUserActive, { isLoading: isBanning }] = useSetUserActiveMutation();

  const confirmToggle = async () => {
    if (!banTarget) return;
    const ban = banTarget.isActive;
    try {
      await setUserActive({ userId: banTarget.id, isActive: !ban }).unwrap();
      toast.success(ban ? `${banTarget.name} has been banned` : `${banTarget.name} has been unbanned`);
      setBanTarget(null);
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ||
          (ban ? "Could not ban the client" : "Could not unban the client")
      );
    }
  };

  // Every client, all pages walked: filters and sorts need the whole list.
  const { data, isLoading, isError, error, refetch } = useGetAllUsersQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });

  const rows: ClientRow[] = useMemo(
    () => ((data ?? []) as unknown as ClientListItemApi[]).map(toClientRow),
    [data]
  );
  const visible = useMemo(() => applyClientFilters(rows, filters), [rows, filters]);
  const accountTypes = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.accountTypes))).sort(),
    [rows]
  );

  const sum = (list: ClientRow[], k: "totalDeposits" | "totalWithdrawals" | "totalBalance") =>
    list.reduce((s, r) => s + r[k], 0);
  const funded = rows.filter((r) => r.totalDeposits > 0);
  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; tone: string }[] = [
    { label: "Total clients", value: String(rows.length), hint: `${rows.filter((r) => r.isActive).length} active`, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "KYC approved", value: String(rows.filter((r) => r.kycStatus === "approved").length), hint: `${rows.filter((r) => r.kycStatus === "pending").length} pending`, icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-600" },
    { label: "Funded clients", value: String(funded.length), hint: `${rows.length - funded.length} never deposited`, icon: Wallet, tone: "bg-blue-100 text-blue-600" },
    { label: "Total deposited", value: usd(sum(rows, "totalDeposits")), hint: `${usd(sum(rows, "totalWithdrawals"))} withdrawn`, icon: ArrowDownLeft, tone: "bg-amber-100 text-amber-600" },
  ];

  const exportCsv = () =>
    exportToCSV({
      headers: [
        "ID", "Name", "Email", "Phone", "KYC", "Status", "Trading accounts", "Active accounts",
        "Account types", "Wallet (USD)", "Crypto wallet (USD)", "Trading (USD)", "Total balance (USD)",
        "Deposited (USD)", "Withdrawn (USD)", "Net (USD)", "Joined",
      ],
      rows: visible.map((c) => [
        c.id, c.name, c.email, c.phone ?? "", c.kycStatus, c.isActive ? "active" : "disabled",
        c.accounts, c.activeAccounts, c.accountTypes.join(" / "), c.walletBalance, c.cryptoBalance,
        c.tradingBalance, c.totalBalance, c.totalDeposits, c.totalWithdrawals, c.netDeposits,
        c.registeredAt,
      ]),
      filename: generateExportFilename("clients"),
    });

  return (
    <DashboardLayout title="Clients">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground">
              Every client with their KYC, trading accounts, balances and funding.
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={visible.length === 0} className="gap-2">
            <Download className="h-4 w-4" />
            Export {visible.length !== rows.length ? `${visible.length} ` : ""}to CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className={`rounded-lg p-2 ${t.tone}`}><t.icon className="h-4 w-4" /></div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight">{t.value}</p>
                <p className="truncate text-[11px] text-muted-foreground">{t.label} · {t.hint}</p>
              </div>
            </div>
          ))}
        </div>

        <ClientsToolbar filters={filters} onChange={setFilters} accountTypes={accountTypes} />

        {isError ? (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <span>
              Failed to load clients: {String((error as { status?: unknown })?.status ?? "Unknown error")}
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Showing {visible.length} of {rows.length} clients
              {filters.sort !== "newest" && <> · sorted by <span className="font-medium text-foreground">{
                { oldest: "oldest first", name: "name", accounts: "trading accounts", balance: "balance", deposits: "deposits", withdrawals: "withdrawals", net: "net deposit", newest: "" }[filters.sort]
              }</span></>}
            </p>
            <ClientsTable
              clients={visible}
              sort={filters.sort}
              loading={isLoading}
              onViewClient={(c) => navigate(`/clients/${c.id}`)}
              onToggleActive={setBanTarget}
            />
          </>
        )}

        <AlertDialog open={banTarget !== null} onOpenChange={(o) => !o && !isBanning && setBanTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {banTarget?.isActive ? `Ban ${banTarget?.name}?` : `Unban ${banTarget?.name}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {banTarget?.isActive
                  ? "They will be signed out everywhere and won't be able to log in, use the client portal or log into any trading account until you unban them. Their balances and open positions are not touched."
                  : "They will be able to log in and use their account and trading accounts again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBanning}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isBanning}
                onClick={(e) => {
                  e.preventDefault();
                  void confirmToggle();
                }}
                className={banTarget?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {isBanning ? "Saving…" : banTarget?.isActive ? "Ban client" : "Unban client"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
