import { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetTradingAccountTradesQuery } from "@/API/users.api";
import type {
  TradeStatusFilter,
  TradingAccount,
} from "@/features/users/users.types";

interface AccountTradesDialogProps {
  account: TradingAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_TABS: { key: TradeStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const lots = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const price = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 5 });

const pnlClass = (n: number | null) =>
  n === null || n === 0
    ? "text-muted-foreground"
    : n > 0
    ? "text-emerald-600"
    : "text-destructive";

const signedUsd = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${usd(n)}`;

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  PARTIALLY_FILLED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  SENDING: "bg-amber-100 text-amber-700",
  ACKED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
};

const humanize = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export function AccountTradesDialog({ account, isOpen, onClose }: AccountTradesDialogProps) {
  const [status, setStatus] = useState<TradeStatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetTradingAccountTradesQuery(
    { tradingAccountId: account?.id ?? 0, status, page },
    { skip: !account || !isOpen }
  );

  const changeStatus = (s: TradeStatusFilter) => {
    setStatus(s);
    setPage(1);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStatus("all");
      setPage(1);
      onClose();
    }
  };

  const s = data?.summary;
  const sideTotal = s ? s.buy.lots + s.sell.lots : 0;
  const buyShare = sideTotal > 0 ? (s!.buy.lots / sideTotal) * 100 : 50;
  const maxSymbolLots = s?.symbols[0]?.lots || 0;

  const tiles: {
    label: string;
    value: string;
    hint?: string;
    icon: LucideIcon;
    tone: string;
    valueClass?: string;
  }[] = s
    ? [
        {
          label: "Total Trades",
          value: s.totalTrades.toLocaleString("en-US"),
          hint: `${s.openTrades} open · ${s.closedTrades} closed`,
          icon: Activity,
          tone: "bg-blue-100 text-blue-600",
        },
        {
          label: "Volume",
          value: `${lots(s.totalLots)} lots`,
          hint: `${s.buy.trades} buy · ${s.sell.trades} sell`,
          icon: BarChart3,
          tone: "bg-purple-100 text-purple-600",
        },
        {
          label: "Realised P&L",
          value: signedUsd(s.realisedPnl),
          hint: "Closed trades only",
          icon: s.realisedPnl < 0 ? TrendingDown : TrendingUp,
          tone: s.realisedPnl < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600",
          valueClass: pnlClass(s.realisedPnl),
        },
        {
          label: "Commission",
          value: usd(s.totalCommission),
          hint: "Charged on this account",
          icon: Percent,
          tone: "bg-primary/15 text-primary",
          valueClass: "text-primary",
        },
        {
          label: "Win Rate",
          value: s.winRate !== null ? `${s.winRate.toFixed(1)}%` : "—",
          hint: `${s.winningTrades} won · ${s.losingTrades} lost`,
          icon: Target,
          tone: "bg-amber-100 text-amber-600",
        },
      ]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Trades · <span className="font-mono">#{account?.tradingUsername}</span>
          </DialogTitle>
          <DialogDescription>
            {account?.accountTypes?.name ?? account?.accountType} account · 1:
            {account?.leverage} leverage
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading trades…
          </div>
        ) : isError || !s ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Could not load trades for this account.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 ${t.tone}`}>
                      <t.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                  </div>
                  <p className={`mt-3 text-xl font-bold tracking-tight ${t.valueClass ?? "text-foreground"}`}>
                    {t.value}
                  </p>
                  {t.hint && <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>}
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              {/* Buy / sell + extremes */}
              <div className="space-y-4 rounded-xl border p-5">
                <p className="text-sm font-semibold text-foreground">Buy vs Sell (lots)</p>
                <div className="space-y-2">
                  <div className="flex h-3 overflow-hidden rounded-full bg-red-200">
                    <div className="h-full bg-emerald-500" style={{ width: `${buyShare}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-emerald-600">
                      Buy {lots(s.buy.lots)} ({s.buy.trades})
                    </span>
                    <span className="font-medium text-destructive">
                      Sell {lots(s.sell.lots)} ({s.sell.trades})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Best trade</p>
                    <p className={`text-lg font-semibold ${pnlClass(s.bestTrade)}`}>
                      {signedUsd(s.bestTrade)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Worst trade</p>
                    <p className={`text-lg font-semibold ${pnlClass(s.worstTrade)}`}>
                      {signedUsd(s.worstTrade)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-semibold">{s.pendingTrades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cancelled / rejected</p>
                    <p className="text-lg font-semibold">{s.cancelledTrades}</p>
                  </div>
                </div>
              </div>

              {/* Symbols */}
              <div className="rounded-xl border p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">By instrument</p>
                {s.symbols.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No trades yet.</p>
                ) : (
                  <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                    {s.symbols.map((sym) => (
                      <div key={sym.symbol} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-mono font-semibold">{sym.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {sym.trades} trades · {lots(sym.lots)} lots ·{" "}
                            <span className={pnlClass(sym.pnl)}>{signedUsd(sym.pnl)}</span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${maxSymbolLots > 0 ? (sym.lots / maxSymbolLots) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trades */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {STATUS_TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={status === t.key}
                      onClick={() => changeStatus(t.key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        status === t.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Opened</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Entry</TableHead>
                      <TableHead className="text-right">Exit</TableHead>
                      <TableHead className="text-right">SL / TP</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Closed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.trades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                          No {status === "all" ? "" : `${status} `}trades.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.trades.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(t.openedAt), "dd MMM yy, HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono font-semibold">{t.symbol}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                t.side === "BUY"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-red-100 text-red-700 hover:bg-red-100"
                              }
                            >
                              {t.side}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {lots(t.lots)}
                            {t.openLots > 0 && t.openLots !== t.lots && (
                              <span className="block text-xs text-muted-foreground">
                                {lots(t.openLots)} open
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{price(t.entryPrice)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{price(t.exitPrice)}</TableCell>
                          <TableCell className="whitespace-nowrap text-right font-mono text-xs text-muted-foreground">
                            {price(t.sl)} / {price(t.tp)}
                          </TableCell>
                          <TableCell className="text-right text-xs">{usd(t.commission)}</TableCell>
                          <TableCell className={`text-right font-semibold ${pnlClass(t.pnl)}`}>
                            {signedUsd(t.pnl)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`whitespace-nowrap hover:opacity-90 ${
                                STATUS_STYLE[t.status] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {humanize(t.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {t.closedAt ? format(new Date(t.closedAt), "dd MMM yy, HH:mm") : "—"}
                            {t.closeReason && (
                              <span className="block text-muted-foreground">
                                {humanize(t.closeReason)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages} ·{" "}
                    {data.pagination.total} trades
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages || isFetching}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
