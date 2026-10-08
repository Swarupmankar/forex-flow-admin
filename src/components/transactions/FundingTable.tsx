import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FundingRow } from "@/features/transactions/funding";
import { inrFmt, usdFmt } from "./FxAmount";

const PAGE_SIZE = 15;

interface FundingTableProps {
  rows: FundingRow[];
  loading?: boolean;
  error?: boolean;
  onOpen: (row: FundingRow) => void;
  /** Show the deposit / withdrawal column (history page). */
  showType?: boolean;
  /** Bulk selection; only pending bank / UPI rows can be picked. */
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

const shorten = (v: string, keep = 6) => (v.length > keep * 2 + 3 ? `${v.slice(0, keep)}…${v.slice(-keep)}` : v);

/**
 * What identifies the payment. A deposit shows what the client paid with: the
 * bank transaction number, the UPI UTR, or the on-chain hash. A withdrawal
 * shows where it goes. `long` values (hashes, addresses) are shortened.
 */
const referenceOf = (r: FundingRow): { label: string; value: string | null; long: boolean } => {
  if (r.direction === "deposit") {
    if (r.method === "bank") return { label: "Txn no.", value: r.reference, long: false };
    if (r.method === "upi") return { label: "UTR", value: r.reference, long: false };
    return { label: "Tx hash", value: r.reference, long: true };
  }
  if (r.method === "bank") return { label: "Account", value: r.destination, long: false };
  if (r.method === "upi") return { label: "UPI ID", value: r.destination, long: false };
  return { label: "To address", value: r.destination, long: true };
};

function MethodCell({ row }: { row: FundingRow }) {
  if (row.method === "crypto") {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-orange-100 p-1.5 text-orange-600"><Bitcoin className="h-3.5 w-3.5" /></div>
        <div>
          <div className="text-sm font-medium">{row.crypto?.coin ?? "Crypto"}</div>
          <div className="text-[11px] text-muted-foreground">
            {row.source === "coinsbuy" ? row.crypto?.network ?? "CoinsBuy" : row.manual?.cryptoNetwork ?? "Manual"}
            {row.isIb && " · IB wallet"}
          </div>
        </div>
      </div>
    );
  }
  const isUpi = row.method === "upi";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-md p-1.5", isUpi ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
        {isUpi ? <Smartphone className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
      </div>
      <div>
        <div className="text-sm font-medium">{isUpi ? "UPI" : "Bank"}</div>
        {row.isIb && <div className="text-[11px] text-muted-foreground">IB commission</div>}
      </div>
    </div>
  );
}

function AmountCell({ row }: { row: FundingRow }) {
  const sign = row.direction === "deposit" ? "+" : "−";
  return (
    <div className="whitespace-nowrap text-right">
      <div className={cn("font-semibold", row.direction === "deposit" ? "text-emerald-600" : "text-foreground")}>
        {sign}
        {usdFmt(row.usd)}
      </div>
      {row.inrAmount != null && (
        <div className="text-[11px] text-muted-foreground">
          {inrFmt(row.inrAmount)}
          {row.fxRate != null && <> @ ₹{row.fxRate.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</>}
        </div>
      )}
      {row.crypto?.coinAmount != null && (
        <div className="text-[11px] text-muted-foreground">
          {row.crypto.coinAmount.toLocaleString("en-US", { maximumFractionDigits: 8 })} {row.crypto.coin ?? ""}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ row }: { row: FundingRow }) {
  const crypto = row.source === "coinsbuy";
  const map = {
    pending: { label: crypto ? "Processing" : "Pending", cls: "bg-amber-100 text-amber-700" },
    approved: { label: crypto ? "Completed" : "Approved", cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: crypto ? "Failed" : "Rejected", cls: "bg-red-100 text-red-700" },
  }[row.status];
  return <Badge className={cn("hover:opacity-90", map.cls)}>{map.label}</Badge>;
}

export function FundingTable({
  rows,
  loading,
  error,
  onOpen,
  showType,
  selected,
  onSelectedChange,
}: FundingTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  // A filter change can leave the page past the end.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectable = Boolean(onSelectedChange);
  const canSelect = (r: FundingRow) => r.source === "manual" && r.status === "pending";
  const pageSelectable = pageRows.filter(canSelect).map((r) => r.key);
  const allOnPage = pageSelectable.length > 0 && pageSelectable.every((k) => selected?.includes(k));

  const toggleAll = (checked: boolean) => {
    if (!onSelectedChange) return;
    const rest = (selected ?? []).filter((k) => !pageSelectable.includes(k));
    onSelectedChange(checked ? [...rest, ...pageSelectable] : rest);
  };
  const toggleOne = (key: string, checked: boolean) => {
    if (!onSelectedChange) return;
    onSelectedChange(checked ? [...(selected ?? []), key] : (selected ?? []).filter((k) => k !== key));
  };

  const colSpan = 7 + (showType ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox checked={allOnPage} onCheckedChange={(c) => toggleAll(Boolean(c))} disabled={pageSelectable.length === 0} />
                </TableHead>
              )}
              <TableHead>Client</TableHead>
              {showType && <TableHead>Type</TableHead>}
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reference / Destination</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-14 text-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…
                </TableCell>
              </TableRow>
            ) : error && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-14 text-center text-sm text-destructive">
                  Couldn't load transactions.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-14 text-center">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">Nothing matches these filters</p>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((r) => {
                const ref = referenceOf(r);
                return (
                  <TableRow key={r.key} className="hover:bg-muted/30">
                    {selectable && (
                      <TableCell>
                        {canSelect(r) && (
                          <Checkbox checked={selected?.includes(r.key)} onCheckedChange={(c) => toggleOne(r.key, Boolean(c))} />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {initials(r.clientName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{r.clientName}</span>
                            {r.isIb && (
                              <span
                                className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700"
                                title="IB commission payout"
                              >
                                IB
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    {showType && (
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium", r.direction === "deposit" ? "text-emerald-600" : "text-rose-600")}>
                          {r.direction === "deposit" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          {r.direction === "deposit" ? "Deposit" : "Withdrawal"}
                        </span>
                      </TableCell>
                    )}
                    <TableCell><MethodCell row={r} /></TableCell>
                    <TableCell><AmountCell row={r} /></TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {ref.label}
                      </div>
                      {ref.value ? (
                        <span className="font-mono text-xs text-foreground" title={ref.value}>
                          {ref.long ? shorten(ref.value) : ref.value}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">{format(new Date(r.createdAt), "dd MMM yyyy")}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge row={r} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={r.source === "manual" && r.status === "pending" ? "default" : "outline"}
                        className="h-8 gap-1 text-xs"
                        onClick={() => onOpen(r)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {r.source === "manual" && r.status === "pending" ? "Review" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
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
    </Card>
  );
}
