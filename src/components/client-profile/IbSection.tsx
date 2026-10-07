import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, parse } from "date-fns";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Coins,
  Loader2,
  Network,
  PauseCircle,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGetClientIbOverviewQuery } from "@/API/users.api";
import type { IbOverviewResponse, IbPeriod, IbReferredClient } from "@/features/users/users.types";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const lots = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} lots`;
const monthLabel = (key: string, fmt = "MMM yyyy") => format(parse(key, "yyyy-MM", new Date()), fmt);
const dt = (s: string) => format(new Date(s), "dd MMM yyyy, HH:mm");

type ClientSort = "commission" | "tradedLots" | "thisMonth" | "lastMonth" | "newest";
type View = "clients" | "ledger" | "withdrawals" | "symbols";

const STATE_CLS: Record<string, string> = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-800",
  CONFIRMED: "border-sky-300 bg-sky-100 text-sky-800",
  PAID: "border-emerald-300 bg-emerald-100 text-emerald-800",
  COMPLETED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  FAILED: "border-red-300 bg-red-100 text-red-800",
};

function StateBadge({ state }: { state: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold", STATE_CLS[state])}>
      {state.charAt(0) + state.slice(1).toLowerCase()}
    </Badge>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={cn("rounded-lg p-1.5", tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Change from last month to this one, as a small arrow and percentage. */
function Change({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return null;
  if (before === 0) return <span className="text-xs font-semibold text-emerald-600">New</span>;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold", up ? "text-emerald-600" : "text-red-600")}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function PeriodCard({ title, period, compare }: { title: string; period: IbPeriod; compare?: IbPeriod }) {
  return (
    <div className={cn("rounded-xl border p-4", compare ? "border-primary/40 bg-primary/5" : "bg-muted/20")}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{monthLabel(period.month, "MMMM yyyy")}</p>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={cn("text-2xl font-bold", compare && "text-primary")}>{usd(period.commission)}</p>
        {compare && <Change now={period.commission} before={compare.commission} />}
      </div>
      <p className="text-xs text-muted-foreground">commission earned</p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
        <div>
          <p className="text-sm font-semibold">{period.lots.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-muted-foreground">Lots closed</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{period.trades}</p>
          <p className="text-[11px] text-muted-foreground">Trades</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{period.clients}</p>
          <p className="text-[11px] text-muted-foreground">Active clients</p>
        </div>
      </div>
    </div>
  );
}

const SOURCE_LABEL: Record<NonNullable<IbOverviewResponse["tierSource"]>, string> = {
  AUTOMATIC_UPGRADE: "Upgraded at evaluation",
  AUTOMATIC_DOWNGRADE: "Downgraded at evaluation",
  MANUAL_ADMIN: "Set by admin",
};

/** The tier in force, since when, and whether the last evaluation put it at risk. */
function TierCard({ data }: { data: IbOverviewResponse }) {
  const risk = data.risk;
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        risk ? "border-red-300 bg-red-50/60" : "border-violet-200 bg-violet-50/50"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IB tier</p>
        {risk ? (
          <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" /> At risk
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">
            <ShieldCheck className="mr-1 h-3 w-3" /> In good standing
          </Badge>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Network className="h-5 w-5 text-violet-600" />
        <p className="text-2xl font-bold text-violet-800">{data.tier ?? "—"}</p>
        {data.tierLevel !== null && <span className="text-xs text-muted-foreground">Level {data.tierLevel}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        {data.tierSince ? (
          <>
            Since {format(new Date(data.tierSince), "dd MMM yyyy")} ·{" "}
            {formatDistanceToNow(new Date(data.tierSince), { addSuffix: true })}
          </>
        ) : (
          "Entry tier"
        )}
        {data.tierSource && <> · {SOURCE_LABEL[data.tierSource]}</>}
      </p>

      {risk && (
        <div className="mt-3 rounded-lg border border-red-200 bg-white/70 p-2.5 text-xs text-red-800">
          Missed this tier's targets since {format(new Date(risk.since), "dd MMM yyyy")}.{" "}
          {risk.failedEvaluations} failed evaluation{risk.failedEvaluations === 1 ? "" : "s"}
          {risk.graceCycles !== null && <> of {risk.graceCycles} allowed before downgrade</>}.
        </div>
      )}

      {(data.tierRequirements || data.payoutHold || data.isSuspended) && (
        <div className="mt-3 space-y-1.5 border-t pt-3 text-xs">
          {data.tierRequirements && (
            <p className="text-muted-foreground">
              Keeps tier with{" "}
              <span className="font-semibold text-foreground">{lots(data.tierRequirements.minVolumeLots)}</span> and{" "}
              <span className="font-semibold text-foreground">{data.tierRequirements.minActiveTraders} active traders</span>{" "}
              per period
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {data.payoutHold && (
              <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                <PauseCircle className="mr-1 h-3 w-3" /> Payout on hold
              </Badge>
            )}
            {data.isSuspended && (
              <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800">
                IB suspended
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const SORTS: Record<ClientSort, { label: string; key: (c: IbReferredClient) => number }> = {
  commission: { label: "Most commission", key: (c) => c.commission },
  tradedLots: { label: "Most lots traded", key: (c) => c.tradedLots },
  thisMonth: { label: "This month commission", key: (c) => c.thisMonthCommission },
  lastMonth: { label: "Last month commission", key: (c) => c.lastMonthCommission },
  newest: { label: "Newest referral", key: (c) => new Date(c.referredAt).getTime() },
};

const th = "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

/** Everything about a client as an IB: who they referred, what it earned, what was paid out. */
export function IbSection({ clientId }: { clientId: number | string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetClientIbOverviewQuery(clientId);
  const [view, setView] = useState<View>("clients");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ClientSort>("commission");

  const clients = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.clients ?? []).filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || String(c.userId).includes(q)
    );
    return [...list].sort((a, b) => SORTS[sort].key(b) - SORTS[sort].key(a));
  }, [data, search, sort]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        Loading IB details…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">Could not load IB details.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const s = data.summary;

  if (s.totalClients === 0 && s.totalCommission === 0 && data.withdrawals.length === 0) {
    return (
      <div className="rounded-xl border bg-card py-16 text-center">
        <Network className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">This client has not referred anyone yet</p>
        {data.referralCode && (
          <p className="mt-1 text-xs text-muted-foreground">
            Referral code <span className="font-mono font-semibold">{data.referralCode}</span>
          </p>
        )}
      </div>
    );
  }

  const views: { key: View; label: string; count: number }[] = [
    { key: "clients", label: "Referred clients", count: data.clients.length },
    { key: "ledger", label: "Commission ledger", count: data.ledger.length },
    { key: "withdrawals", label: "IB withdrawals", count: data.withdrawals.length },
    { key: "symbols", label: "By symbol", count: data.bySymbol.length },
  ];

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          label="Referred clients"
          value={String(s.totalClients)}
          hint={`${s.activeClients} have traded`}
          icon={Users}
          tone="bg-violet-100 text-violet-600"
        />
        <Kpi
          label="Volume traded by clients"
          value={lots(s.tradedLots)}
          hint={`${lots(s.commissionLots)} closed for commission`}
          icon={BarChart3}
          tone="bg-sky-100 text-sky-600"
        />
        <Kpi
          label="Total commission earned"
          value={usd(s.totalCommission)}
          hint={`Paid ${usd(s.paidCommission)} · Pending ${usd(s.pendingCommission + s.confirmedCommission)}`}
          icon={Coins}
          tone="bg-primary/15 text-primary"
        />
        <Kpi
          label="Withdrawn"
          value={usd(s.withdrawn)}
          hint={s.pendingWithdrawal > 0 ? `${usd(s.pendingWithdrawal)} pending` : "Completed IB withdrawals"}
          icon={ArrowUpRight}
          tone="bg-rose-100 text-rose-600"
        />
        <Kpi
          label="IB wallet balance"
          value={usd(s.walletBalance)}
          hint="Available to withdraw"
          icon={Wallet}
          tone="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* This month vs last */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <PeriodCard title="This month" period={s.thisMonth} compare={s.lastMonth} />
        <PeriodCard title="Last month" period={s.lastMonth} />
        <TierCard data={data} />
      </div>

      {/* Month by month */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Month by month</p>
          <p className="text-xs text-muted-foreground">By trade close date, {data.timezone} time</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={cn(th, "text-left")}>Month</th>
                <th className={cn(th, "text-right")}>Commission</th>
                <th className={cn(th, "text-right")}>Lots closed</th>
                <th className={cn(th, "text-right")}>Trades</th>
                <th className={cn(th, "text-right")}>Active clients</th>
                <th className={cn(th, "text-right")}>Withdrawn</th>
              </tr>
            </thead>
            <tbody>
              {[...data.monthly].reverse().map((m) => (
                <tr key={m.month} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{monthLabel(m.month)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-primary">{usd(m.commission)}</td>
                  <td className="px-4 py-2.5 text-right">{m.lots.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-right">{m.trades}</td>
                  <td className="px-4 py-2.5 text-right">{m.activeClients}</td>
                  <td className="px-4 py-2.5 text-right">{usd(m.withdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail views */}
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            aria-pressed={view === v.key}
            onClick={() => setView(v.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              view === v.key
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
            <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", view === v.key ? "bg-primary-foreground/20" : "bg-muted")}>
              {v.count}
            </span>
          </button>
        ))}
      </div>

      {view === "clients" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as ClientSort)}>
              <SelectTrigger className="h-9 w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORTS) as ClientSort[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORTS[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={cn(th, "text-left")}>Client</th>
                  <th className={cn(th, "text-left")}>Referred</th>
                  <th className={cn(th, "text-right")}>Lots traded</th>
                  <th className={cn(th, "text-right")}>Commission earned</th>
                  <th className={cn(th, "text-right")}>This month</th>
                  <th className={cn(th, "text-right")}>Last month</th>
                  <th className={cn(th, "text-left")}>Last trade</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No referred clients match
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr
                      key={c.userId}
                      onClick={() => navigate(`/clients/${c.userId}`)}
                      className="cursor-pointer border-t transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{c.name || "—"}</span>
                          {!c.isActive && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                              Banned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <span className="font-mono text-[11px] text-muted-foreground">#{c.userId}</span>
                          {c.accountTypes.map((t) => (
                            <span key={t} className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">{format(new Date(c.referredAt), "dd MMM yyyy")}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="font-semibold">{c.tradedLots.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                        <div className="text-[11px] text-muted-foreground">{c.trades} trades</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="font-semibold text-primary">{usd(c.commission)}</div>
                        <div className="text-[11px] text-muted-foreground">
                          on {c.commissionLots.toLocaleString("en-US", { maximumFractionDigits: 2 })} closed lots
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="font-medium">{usd(c.thisMonthCommission)}</div>
                        <div className="text-[11px] text-muted-foreground">{c.thisMonthLots} lots</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="font-medium">{usd(c.lastMonthCommission)}</div>
                        <div className="text-[11px] text-muted-foreground">{c.lastMonthLots} lots</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {c.lastTradeAt ? format(new Date(c.lastTradeAt), "dd MMM yyyy") : "No trades"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "ledger" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-xs text-muted-foreground">
            Latest {data.ledger.length} commission entries, one per closed trade
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={cn(th, "text-left")}>Closed</th>
                  <th className={cn(th, "text-left")}>Client</th>
                  <th className={cn(th, "text-left")}>Symbol</th>
                  <th className={cn(th, "text-left")}>Account type</th>
                  <th className={cn(th, "text-right")}>Lots</th>
                  <th className={cn(th, "text-right")}>Rate / lot</th>
                  <th className={cn(th, "text-right")}>Commission</th>
                  <th className={cn(th, "text-left")}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      No commission yet
                    </td>
                  </tr>
                ) : (
                  data.ledger.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs">{dt(l.closedAt)}</td>
                      <td className="px-4 py-2.5">
                        {l.clientUserId ? (
                          <button
                            type="button"
                            className="text-left font-medium hover:underline"
                            onClick={() => navigate(`/clients/${l.clientUserId}`)}
                          >
                            {l.clientName || `#${l.clientUserId}`}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{l.symbol}</td>
                      <td className="px-4 py-2.5 text-xs">{l.accountType}</td>
                      <td className="px-4 py-2.5 text-right">{l.lots}</td>
                      <td className="px-4 py-2.5 text-right">{usd(l.rate)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-primary">{usd(l.amount)}</td>
                      <td className="px-4 py-2.5">
                        <StateBadge state={l.state} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "withdrawals" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={cn(th, "text-left")}>Date</th>
                  <th className={cn(th, "text-right")}>Amount</th>
                  <th className={cn(th, "text-left")}>Coin</th>
                  <th className={cn(th, "text-left")}>Address / Tx hash</th>
                  <th className={cn(th, "text-left")}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No IB withdrawals yet
                    </td>
                  </tr>
                ) : (
                  data.withdrawals.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs">{dt(w.createdAt)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{usd(w.amount)}</td>
                      <td className="px-4 py-2.5 text-xs">
                        {w.coin ?? "—"}
                        {w.network && <span className="text-muted-foreground"> · {w.network}</span>}
                      </td>
                      <td className="max-w-[280px] px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                        <div className="truncate" title={w.address ?? undefined}>{w.address ?? "—"}</div>
                        {w.txHash && <div className="truncate" title={w.txHash}>{w.txHash}</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        <StateBadge state={w.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "symbols" && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className={cn(th, "text-left")}>Symbol</th>
                  <th className={cn(th, "text-right")}>Lots closed</th>
                  <th className={cn(th, "text-right")}>Trades</th>
                  <th className={cn(th, "text-right")}>Commission</th>
                  <th className={cn(th, "text-right")}>Share</th>
                </tr>
              </thead>
              <tbody>
                {data.bySymbol.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                      No commission yet
                    </td>
                  </tr>
                ) : (
                  data.bySymbol.map((r) => {
                    const share = s.totalCommission > 0 ? (r.commission / s.totalCommission) * 100 : 0;
                    return (
                      <tr key={r.symbol} className="border-t">
                        <td className="px-4 py-2.5 font-medium">{r.symbol}</td>
                        <td className="px-4 py-2.5 text-right">{r.lots}</td>
                        <td className="px-4 py-2.5 text-right">{r.trades}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-primary">{usd(r.commission)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-primary" style={{ width: `${share}%` }} />
                            </div>
                            <span className="w-12 text-right text-xs">{share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
