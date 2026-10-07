import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Ban, ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, ShieldCheck, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClientRow, ClientSort } from "@/features/users/clientList";

const PAGE_SIZE = 20;

interface ClientsTableProps {
  clients: ClientRow[];
  sort: ClientSort;
  loading?: boolean;
  onViewClient: (client: ClientRow) => void;
  /** Ban an active client or re-enable a banned one. */
  onToggleActive: (client: ClientRow) => void;
}

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

const KYC: Record<ClientRow["kycStatus"], { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "border border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  pending: { label: "Pending", cls: "border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100" },
  rejected: { label: "Rejected", cls: "border border-red-300 bg-red-100 text-red-800 hover:bg-red-100" },
};

export function ClientsTable({ clients, sort, loading, onViewClient, onToggleActive }: ClientsTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));

  // A filter change can leave the page past the end.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const rows = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // The column the list is sorted by is highlighted.
  const head = (label: string, key?: ClientSort, right?: boolean) => (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide",
        right ? "text-right" : "text-left",
        key && sort === key ? "text-primary" : "text-muted-foreground"
      )}
    >
      {label}
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/40">
            <tr>
              {head("Client", "name")}
              {head("KYC")}
              {head("Trading accounts", "accounts")}
              {head("Balance", "balance", true)}
              {head("Deposited", "deposits", true)}
              {head("Withdrawn", "withdrawals", true)}
              {head("Net", "net", true)}
              {head("Joined", sort === "oldest" ? "oldest" : "newest")}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading clients…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">No clients match these filters</p>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onViewClient(c)}
                  className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(c.name)}
                        </div>
                        {!c.isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-red-500" title="Banned" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-foreground">{c.name}</span>
                          {!c.isActive && (
                            <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                              Banned
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">#{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={KYC[c.kycStatus].cls}>{KYC[c.kycStatus].label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold">
                      {c.accounts}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">({c.activeAccounts} active)</span>
                    </div>
                    {c.accountTypes.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.accountTypes.slice(0, 3).map((t) => (
                          <span key={t} className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t}</span>
                        ))}
                        {c.accountTypes.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{c.accountTypes.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="font-semibold">{usd(c.totalBalance)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Wallet {usd(c.walletBalance + c.cryptoBalance)} · Trading {usd(c.tradingBalance)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">{usd(c.totalDeposits)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">{usd(c.totalWithdrawals)}</td>
                  <td className={cn("whitespace-nowrap px-4 py-3 text-right font-semibold", c.netDeposits < 0 ? "text-destructive" : "text-foreground")}>
                    {usd(c.netDeposits)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-sm">{format(new Date(c.registeredAt), "dd MMM yyyy")}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.registeredAt), { addSuffix: true })}
                    </div>
                  </td>
                  {/* The row opens the profile; the menu must not. */}
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${c.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewClient(c)}>
                          <Eye className="mr-2 h-4 w-4" /> View profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.isActive ? (
                          <DropdownMenuItem
                            onClick={() => onToggleActive(c)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" /> Ban client
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onToggleActive(c)} className="text-emerald-600 focus:text-emerald-600">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Unban client
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {clients.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, clients.length)} of {clients.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
