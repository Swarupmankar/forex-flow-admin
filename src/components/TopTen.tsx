import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CandlestickChart,
  Database,
  Loader2,
  Network,
  Percent,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetTransactionsQuery } from "@/API/transactions.api";
import { useGetAllPartnersQuery } from "@/API/ibAdmin.api";

type TabKey =
  | "clientsByVolume"
  | "instruments"
  | "clientsByCommission"
  | "ibs"
  | "deposits"
  | "withdrawals";

type Period = "7d" | "30d" | "90d" | "all";
type IbMetric = "mtdCommission" | "mtdLots" | "activeClients";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "clientsByVolume", label: "Clients by Volume", icon: BarChart3 },
  { key: "instruments", label: "Traded Instruments", icon: CandlestickChart },
  { key: "clientsByCommission", label: "Clients by Commission", icon: Percent },
  { key: "ibs", label: "IBs", icon: Network },
  { key: "deposits", label: "Deposits", icon: ArrowDownToLine },
  { key: "withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
];

// These rankings come from trade history, which the admin API does not expose
// yet. They stay empty rather than show invented rows.
const NO_SOURCE: Partial<Record<TabKey, string>> = {
  clientsByVolume: "Needs a backend endpoint that sums closed lots per client.",
  instruments: "Needs a backend endpoint that sums closed lots per symbol.",
  clientsByCommission:
    "Needs a backend endpoint that sums the commission charged per client.",
};

// Column headers for the tabs that have no data yet, so the table still shows
// what it will hold.
const PLACEHOLDER_COLUMNS: Partial<Record<TabKey, { meta: string[]; value: string }>> = {
  clientsByVolume: { meta: ["Trades"], value: "Lots" },
  instruments: { meta: ["Trades"], value: "Lots" },
  clientsByCommission: { meta: ["Account Type", "Lots"], value: "Commission" },
};

const PERIOD_DAYS: Record<Exclude<Period, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const PERIOD_LABEL: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const IB_METRIC_LABEL: Record<IbMetric, string> = {
  mtdCommission: "Commission (MTD)",
  mtdLots: "Lots (MTD)",
  activeClients: "Active Clients",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

const formatNumber = (n: number) => n.toLocaleString("en-US");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const RANK_STYLE = [
  "bg-amber-100 text-amber-700 ring-amber-300",
  "bg-slate-200 text-slate-700 ring-slate-300",
  "bg-orange-100 text-orange-700 ring-orange-300",
];

type Row = {
  key: string | number;
  name: string;
  subtitle?: string;
  meta: string[];
  value: number;
};

export function TopTen() {
  const [tab, setTab] = useState<TabKey>("deposits");
  const [period, setPeriod] = useState<Period>("all");
  const [ibMetric, setIbMetric] = useState<IbMetric>("mtdCommission");

  const {
    data: transactions,
    isLoading: isTxLoading,
    isError: isTxError,
  } = useGetTransactionsQuery({ getAllPending: false });
  const {
    data: partnersData,
    isLoading: isIbLoading,
    isError: isIbError,
  } = useGetAllPartnersQuery(undefined, { skip: tab !== "ibs" });

  const since = useMemo(
    () => (period === "all" ? null : subDays(new Date(), PERIOD_DAYS[period])),
    [period]
  );

  // The IB list is month-to-date on the backend, so the period filter cannot
  // apply to it; it gets a ranking metric instead.
  const isIbTab = tab === "ibs";
  const isMoney = !(isIbTab && ibMetric !== "mtdCommission");
  const formatValue = (n: number) => (isMoney ? formatCurrency(n) : formatNumber(n));

  let metaHeaders: string[] = [];
  let valueHeader = "";
  let rows: Row[] = [];
  let isLoading = false;
  let isError = false;

  if (tab === "deposits" || tab === "withdrawals") {
    const type = tab === "deposits" ? "DEPOSIT" : "WITHDRAW";
    metaHeaders = ["Method", "Date"];
    valueHeader = "Amount";
    isLoading = isTxLoading;
    isError = isTxError;
    rows = (transactions ?? [])
      .filter(
        (t) =>
          t.transactionType === type &&
          t.transactionStatus === "APPROVED" &&
          (!since || new Date(t.createdAt) >= since)
      )
      .map((t) => ({
        key: t.id,
        name: t.name,
        subtitle: t.email,
        meta: [t.mode, format(new Date(t.createdAt), "dd MMM yyyy, HH:mm")],
        value: Number(t.amount) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  } else if (isIbTab) {
    // The ranking metric moves to the value column; the other two stay as meta.
    const others = (Object.keys(IB_METRIC_LABEL) as IbMetric[]).filter(
      (m) => m !== ibMetric
    );
    metaHeaders = ["Tier", ...others.map((m) => IB_METRIC_LABEL[m])];
    valueHeader = IB_METRIC_LABEL[ibMetric];
    isLoading = isIbLoading;
    isError = isIbError;
    rows = (partnersData?.data.partners ?? [])
      .map((p) => ({
        key: p.ibUserId,
        name: p.name,
        subtitle: p.email,
        meta: [
          p.currentTier,
          ...others.map((m) =>
            m === "mtdCommission"
              ? formatCurrency(p[m] ?? 0)
              : formatNumber(p[m] ?? 0)
          ),
        ],
        value: p[ibMetric] ?? 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  } else {
    metaHeaders = PLACEHOLDER_COLUMNS[tab]?.meta ?? [];
    valueHeader = PLACEHOLDER_COLUMNS[tab]?.value ?? "";
  }

  const maxValue = rows[0]?.value || 0;
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const activeTab = TABS.find((t) => t.key === tab)!;
  const colSpan = metaHeaders.length + 3;

  const emptyState = NO_SOURCE[tab]
    ? { icon: Database, title: "Data not available yet", text: NO_SOURCE[tab]! }
    : isError
    ? { icon: Database, title: "Failed to load data", text: "Please try again in a moment." }
    : !isLoading && rows.length === 0
    ? {
        icon: Trophy,
        title: "Nothing to rank",
        text: isIbTab ? "No IB partners yet." : `No approved ${activeTab.label.toLowerCase()} in this period.`,
      }
    : null;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top 10</h3>
            <p className="text-sm text-muted-foreground">
              {isIbTab
                ? `IBs ranked by ${IB_METRIC_LABEL[ibMetric].toLowerCase()}`
                : `${activeTab.label} · ${PERIOD_LABEL[period]}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {rows.length > 0 && (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Top {rows.length} total
              </p>
              <p className="text-lg font-bold text-foreground">{formatValue(total)}</p>
            </div>
          )}
          {isIbTab ? (
            <Select value={ibMetric} onValueChange={(v) => setIbMetric(v as IbMetric)}>
              <SelectTrigger className="w-[190px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(IB_METRIC_LABEL) as IbMetric[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    Rank by {IB_METRIC_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
              disabled={!!NO_SOURCE[tab]}
            >
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b px-6 py-4">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(t.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-16 px-6 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">
                {tab === "instruments" ? "Symbol" : isIbTab ? "IB" : "Client"}
              </th>
              {metaHeaders.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                  {h}
                </th>
              ))}
              <th className="min-w-[180px] px-6 py-3 text-right font-semibold text-primary">
                {valueHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !emptyState && (
              <tr>
                <td colSpan={colSpan} className="py-12">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                </td>
              </tr>
            )}

            {emptyState && (
              <tr>
                <td colSpan={colSpan} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <emptyState.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{emptyState.title}</p>
                    <p className="max-w-sm text-sm text-muted-foreground">{emptyState.text}</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !emptyState &&
              rows.map((row, i) => (
                <tr
                  key={row.key}
                  className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i < 3 ? `ring-1 ${RANK_STYLE[i]}` : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(row.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                        {row.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {row.meta.map((m, j) => (
                    <td key={j} className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {m}
                    </td>
                  ))}
                  <td className="px-6 py-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-bold text-foreground">{formatValue(row.value)}</span>
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${maxValue > 0 ? (row.value / maxValue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
