import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  QrCode,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  apiErrorMessage,
  useGetPaymentReceiptsQuery,
  type BankPeriod,
  type MethodReceipt,
  type MoneyFlow,
  type UpiPeriod,
} from "@/API/paymentDetails.api";

const inr = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const when = (v: string) => format(new Date(v), "dd MMM yyyy, HH:mm");
const maskAcc = (v: string) => (v ? `····${v.slice(-4)}` : "—");
// Rows filed before rupee amounts were stored have only the USD side.
const money = (inrAmt: number, usdAmt: number) => (inrAmt > 0 ? inr(inrAmt) : usd(usdAmt));

const STATUS: Record<MethodReceipt["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

type Period = UpiPeriod | BankPeriod;
const isUpi = (p: Period): p is UpiPeriod => "upiId" in p;
const periodKey = (p: Period) => `${isUpi(p) ? p.upiId : p.bankAccountNo}-${p.activeFrom}`;

/* ── One method's flow table ── */

const COLS: { key: "total" | "pending" | "approved" | "rejected"; label: string; cls: string }[] = [
  { key: "total", label: "Total", cls: "text-foreground" },
  { key: "pending", label: "Pending", cls: "text-amber-600" },
  { key: "approved", label: "Approved", cls: "text-emerald-600" },
  { key: "rejected", label: "Rejected", cls: "text-red-600" },
];

const cell = (f: MoneyFlow, k: (typeof COLS)[number]["key"]) =>
  k === "total"
    ? { count: f.count, amount: money(f.totalInr, f.totalUsd) }
    : k === "pending"
    ? { count: f.pendingCount, amount: money(f.pendingInr, f.pendingUsd) }
    : k === "approved"
    ? { count: f.approvedCount, amount: money(f.approvedInr, f.approvedUsd) }
    : { count: f.rejectedCount, amount: money(f.rejectedInr, f.rejectedUsd) };

function FlowGrid({ period }: { period: Period }) {
  const rows = [
    { label: "Deposits", icon: ArrowDownLeft, tone: "bg-emerald-100 text-emerald-600", flow: period.deposits },
    { label: "Withdrawals", icon: ArrowUpRight, tone: "bg-rose-100 text-rose-600", flow: period.withdrawals },
  ];
  const netUsd = period.deposits.approvedUsd - period.withdrawals.approvedUsd;
  const bothInr = period.deposits.approvedInr > 0 || period.withdrawals.approvedInr > 0;
  const netInr = period.deposits.approvedInr - period.withdrawals.approvedInr;

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground" />
              {COLS.map((c) => (
                <th key={c.key} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-md p-1.5", r.tone)}><r.icon className="h-4 w-4" /></div>
                    <span className="text-sm font-semibold">{r.label}</span>
                  </div>
                </td>
                {COLS.map((c) => {
                  const v = cell(r.flow, c.key);
                  return (
                    <td key={c.key} className="whitespace-nowrap px-4 py-3">
                      <div className={cn("text-xl font-bold leading-tight", c.cls)}>{v.count}</div>
                      <div className="text-xs font-medium text-muted-foreground">{v.amount}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Net (approved deposits − approved withdrawals)</span>
        <span className={cn("font-bold", netUsd < 0 ? "text-destructive" : "text-emerald-600")}>
          {bothInr ? `${inr(netInr)} · ` : ""}{usd(netUsd)}
        </span>
      </div>
    </div>
  );
}

function FlowList({ flow, direction }: { flow: MoneyFlow; direction: "deposit" | "withdraw" }) {
  const [q, setQ] = useState("");
  const isDeposit = direction === "deposit";
  const refLabel = isDeposit ? "UTR / Txn no." : "Paid to";

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? flow.items.filter((d) =>
          [d.name, d.email, d.reference, String(d.id)].filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
        )
      : flow.items;
  }, [flow.items, q]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={`Client, email or ${isDeposit ? "UTR" : "UPI / account"}`} value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8 text-xs" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>{refLabel}</TableHead>
              <TableHead className="text-right">{isDeposit ? "Paid (INR)" : "Payout (INR)"}</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">{isDeposit ? "Credit (USD)" : "Debit (USD)"}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                  {flow.items.length === 0 ? `No ${isDeposit ? "deposits" : "withdrawals"}.` : "Nothing matches."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap text-xs">{when(d.createdAt)}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{d.name || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{d.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.reference || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">{d.inrAmount != null ? inr(d.inrAmount) : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">{d.fxRate != null ? `₹${d.fxRate}` : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{usd(d.usdAmount)}</TableCell>
                  <TableCell>
                    <Badge className={cn("hover:opacity-90", STATUS[d.status])}>
                      {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {flow.count > flow.items.length && (
        <p className="text-[11px] text-muted-foreground">
          Showing the latest {flow.items.length} of {flow.count}. Totals above cover all of them.
        </p>
      )}
    </div>
  );
}

/** One UPI ID or bank account: when it was live, money in and out while it was. */
export function ReceiptsPanel({ period }: { period: Period }) {
  const [open, setOpen] = useState<"deposit" | "withdraw" | null>(null);
  const upi = isUpi(period);
  const Icon: LucideIcon = upi ? QrCode : Building2;
  const clients = Math.max(period.deposits.clients, period.withdrawals.clients);

  return (
    <Card className={cn(period.isCurrent && "border-primary/40")}>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-2", upi ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {upi ? (
                <span className="font-mono">{period.upiId}</span>
              ) : (
                <span>
                  {period.bankName} <span className="font-mono text-sm text-muted-foreground">{maskAcc(period.bankAccountNo)}</span>
                </span>
              )}
              {period.isCurrent && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Live now</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              {upi ? period.payeeName || "—" : `${period.accountHolderName} · ${period.bankIfscCode}`} ·{" "}
              {period.isCurrent
                ? `live since ${when(period.activeFrom)}`
                : `${when(period.activeFrom)} → ${period.activeTo ? when(period.activeTo) : "now"}`}
              {clients > 0 && ` · ${clients} client${clients === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
        </div>

        <FlowGrid period={period} />

        <div className="flex flex-wrap gap-2">
          {([
            { key: "deposit", label: "Deposits", flow: period.deposits },
            { key: "withdraw", label: "Withdrawals", flow: period.withdrawals },
          ] as const).map((b) => (
            <Button
              key={b.key}
              variant={open === b.key ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={b.flow.count === 0}
              onClick={() => setOpen(open === b.key ? null : b.key)}
            >
              {open === b.key ? `Hide ${b.label.toLowerCase()}` : `Show ${b.label.toLowerCase()} (${b.flow.count})`}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open === b.key && "rotate-180")} />
            </Button>
          ))}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          <FlowList flow={open === "deposit" ? period.deposits : period.withdrawals} direction={open} />
        </CardContent>
      )}
    </Card>
  );
}

function ReceiptsError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Couldn't load payments</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {apiErrorMessage(error, "Please try again.")}
        <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>
      </AlertDescription>
    </Alert>
  );
}

/* ── UPI / Bank switcher, shared by current and history ── */

interface MethodOption {
  key: "UPI" | "BANK";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
  periods: Period[];
  empty: string;
}

function MethodSwitcher({ options, heading }: { options: MethodOption[]; heading: (o: MethodOption) => string }) {
  const [show, setShow] = useState<"UPI" | "BANK" | null>(null);
  const selected = options.find((o) => o.key === show);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((o) => {
          const active = show === o.key;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={active}
              onClick={() => setShow(active ? null : o.key)}
              className={cn(
                "flex items-center gap-4 rounded-xl border-2 bg-card p-5 text-left transition-all hover:shadow-md",
                active ? "border-primary shadow-md" : "border-border"
              )}
            >
              <div className={cn("rounded-xl p-3", o.tone)}><o.icon className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{o.title}</p>
                <p className="truncate text-sm text-muted-foreground">{o.subtitle}</p>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", active && "rotate-180 text-primary")} />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{heading(selected)}</h3>
          {selected.periods.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{selected.empty}</p>
          ) : (
            selected.periods.map((p) => <ReceiptsPanel key={periodKey(p)} period={p} />)
          )}
        </div>
      )}
    </div>
  );
}

const flowSummary = (periods: Period[]) => {
  const d = periods.reduce((s, p) => s + p.deposits.count, 0);
  const w = periods.reduce((s, p) => s + p.withdrawals.count, 0);
  return `${d} deposits · ${w} withdrawals`;
};

/** Money in and out on the UPI ID and bank account that are live now. */
export function CurrentReceipts() {
  const { data, isLoading, isError, error, refetch } = useGetPaymentReceiptsQuery();
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError) return <ReceiptsError error={error} onRetry={refetch} />;

  const upi = (data?.upi ?? []).filter((p) => p.isCurrent);
  const bank = (data?.bank ?? []).filter((p) => p.isCurrent);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Payments on current details</h2>
        <p className="text-sm text-muted-foreground">
          Bank / UPI deposits and withdrawals filed while these details are live.
        </p>
      </div>
      <MethodSwitcher
        heading={(o) => (o.key === "UPI" ? "Current UPI ID" : "Current bank account")}
        options={[
          {
            key: "UPI",
            title: "Show UPI payments",
            subtitle: upi[0] ? `${upi[0].upiId} · ${flowSummary(upi)}` : "No UPI ID set",
            icon: QrCode,
            tone: "bg-blue-100 text-blue-600",
            periods: upi,
            empty: "No UPI ID is set right now.",
          },
          {
            key: "BANK",
            title: "Show bank payments",
            subtitle: bank[0] ? `${bank[0].bankName} ${maskAcc(bank[0].bankAccountNo)} · ${flowSummary(bank)}` : "No bank account set",
            icon: Building2,
            tone: "bg-emerald-100 text-emerald-600",
            periods: bank,
            empty: "No bank account is set right now.",
          },
        ]}
      />
    </div>
  );
}

/** The latest change per method, and past UPI IDs / bank accounts with their money. */
export function PaymentHistoryView() {
  const { data, isLoading, isError, error, refetch } = useGetPaymentReceiptsQuery();
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ReceiptsError error={error} onRetry={refetch} />;

  const changes = data?.changes ?? [];
  const pastUpi = (data?.upi ?? []).filter((p) => !p.isCurrent);
  const pastBank = (data?.bank ?? []).filter((p) => !p.isCurrent);

  const methods = [
    { key: "UPI" as const, title: "UPI ID", icon: QrCode, tone: "bg-blue-100 text-blue-600" },
    { key: "BANK" as const, title: "Bank account", icon: Building2, tone: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Latest change per method */}
      <div className="grid gap-4 md:grid-cols-2">
        {methods.map((m) => {
          // changes is newest first, so the first match is the latest.
          const last = changes.find((c) => c.method === m.key);
          return (
            <Card key={m.key}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-2", m.tone)}><m.icon className="h-4 w-4" /></div>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Last updated</p>
                  <p className="text-xs font-medium">
                    {last ? `${when(last.at)} · ${formatDistanceToNow(new Date(last.at), { addSuffix: true })}` : "Never"}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {last ? (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="min-w-0 rounded-lg border border-dashed px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Previous</p>
                      <p className={cn("truncate font-mono text-xs text-muted-foreground", last.from && "line-through")} title={last.from || undefined}>
                        {last.from || "Not set"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className={cn("min-w-0 rounded-lg border px-3 py-2", last.to ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Current</p>
                      <p className={cn("truncate font-mono text-xs font-semibold", last.to ? "text-emerald-700" : "text-red-700")} title={last.to || undefined}>
                        {last.to || "Removed"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not set up yet.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MethodSwitcher
        heading={(o) => (o.key === "UPI" ? "Previous UPI IDs" : "Previous bank accounts")}
        options={[
          {
            key: "UPI",
            title: "Show UPI history",
            subtitle: `${pastUpi.length} previous UPI ID${pastUpi.length === 1 ? "" : "s"} · ${flowSummary(pastUpi)}`,
            icon: QrCode,
            tone: "bg-blue-100 text-blue-600",
            periods: pastUpi,
            empty: "No previous UPI IDs. Payments on the current one are on the Payment methods tab.",
          },
          {
            key: "BANK",
            title: "Show bank history",
            subtitle: `${pastBank.length} previous bank account${pastBank.length === 1 ? "" : "s"} · ${flowSummary(pastBank)}`,
            icon: Building2,
            tone: "bg-emerald-100 text-emerald-600",
            periods: pastBank,
            empty: "No previous bank accounts. Payments on the current one are on the Payment methods tab.",
          },
        ]}
      />
    </div>
  );
}
