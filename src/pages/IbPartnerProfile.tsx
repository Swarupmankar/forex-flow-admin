import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Coins,
  ExternalLink,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useAssignManagerMutation,
  useGetPartnerByIdQuery,
  useGetTiersQuery,
  useManualTierOverrideMutation,
  useSuspendPartnerMutation,
  useTogglePayoutHoldMutation,
  type IbPartnerDetail,
  type IbTier,
} from "@/API/ibAdmin.api";

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
const num = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const day = (s: string) => format(new Date(s), "dd MMM yyyy");
const errMsg = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message || fallback;

const KYC_CLS: Record<string, string> = {
  APPROVED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  PENDING: "border-amber-300 bg-amber-100 text-amber-800",
  REJECTED: "border-red-300 bg-red-100 text-red-800",
};
const STATE_CLS: Record<string, string> = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-800",
  CONFIRMED: "border-sky-300 bg-sky-100 text-sky-800",
  PAID: "border-emerald-300 bg-emerald-100 text-emerald-800",
  COMPLETED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  RELEASED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  FAILED: "border-red-300 bg-red-100 text-red-800",
};
const SOURCE_LABEL: Record<string, string> = {
  AUTOMATIC_UPGRADE: "upgraded at evaluation",
  AUTOMATIC_DOWNGRADE: "downgraded at evaluation",
  MANUAL_ADMIN: "set by admin",
};
const MODE_LABEL: Record<string, string> = {
  CALENDAR_MONTH: "this month so far",
  ROLLING_30_DAYS: "last 30 days",
  LIFETIME: "lifetime",
};

const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function StateBadge({ state }: { state: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-semibold", STATE_CLS[state])}
    >
      {cap(state)}
    </Badge>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 truncate text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
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
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className={cn("rounded-md p-1", tone)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="truncate text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
      {hint && (
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProgressRow({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 100;
  const met = value >= target;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="font-bold">
          {num(value)} / {num(target)} {unit}
          {met && (
            <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-emerald-600" />
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            met ? "bg-emerald-600" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const th =
  "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
type View = "clients" | "ledger" | "withdrawals" | "accountTypes" | "bonuses";

/** One IB from the directory, as its own page. Every figure comes from the backend. */
export default function IbPartnerProfile() {
  const navigate = useNavigate();
  const ibId = Number(useParams<{ ibId: string }>().ibId) || 0;
  const { data, isLoading, isError, isFetching, refetch } =
    useGetPartnerByIdQuery(ibId, {
      skip: !ibId,
      refetchOnMountOrArgChange: true,
    });
  const { data: tiersData } = useGetTiersQuery();
  const tiers: IbTier[] = tiersData?.data ?? [];
  const d: IbPartnerDetail | undefined = data?.data;
  const backToDirectory = () => navigate("/ib-management?tab=partners");
  const onViewRatePlan = (tier: IbTier) =>
    navigate(`/ib-management/tiers/${tier.id}/rates`);

  const [togglePayoutHold, holdState] = useTogglePayoutHoldMutation();
  const [suspendPartner, suspendState] = useSuspendPartnerMutation();
  const [assignManager, managerState] = useAssignManagerMutation();
  const [manualOverride, overrideState] = useManualTierOverrideMutation();

  const [view, setView] = useState<View>("clients");
  const [showTierForm, setShowTierForm] = useState(false);
  const [targetTierId, setTargetTierId] = useState(0);
  const [grantBonus, setGrantBonus] = useState(false);
  const [reason, setReason] = useState("");
  const [managerInput, setManagerInput] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  // Another partner starts from a clean page.
  useEffect(() => {
    setView("clients");
    setShowTierForm(false);
    setGrantBonus(false);
    setReason("");
    setManagerInput("");
  }, [ibId]);

  useEffect(() => {
    if (d) {
      setTargetTierId(d.currentTierId || tiers[0]?.id || 0);
      setManagerInput(d.assignedManager ?? "");
    }
  }, [d?.ibUserId, d?.currentTierId, d?.assignedManager, tiers]); // eslint-disable-line react-hooks/exhaustive-deps

  // The live record decides every action.
  const payoutHold = d?.payoutHold ?? false;
  const isSuspended = d?.isSuspended ?? false;

  const handleHold = async () => {
    const hold = !payoutHold;
    try {
      await togglePayoutHold({
        ibId,
        hold,
        reason: hold
          ? "Payout hold applied by admin"
          : "Payout hold released by admin",
      }).unwrap();
      toast.success(hold ? "Payouts put on hold" : "Payouts released");
    } catch (err) {
      toast.error(errMsg(err, "Could not update the payout hold."));
    }
  };

  const handleSuspend = async () => {
    const suspend = !isSuspended;
    try {
      await suspendPartner({
        ibId,
        suspend,
        reason: suspend ? "Suspended by admin" : "Reactivated by admin",
      }).unwrap();
      toast.success(suspend ? "IB suspended" : "IB reactivated");
    } catch (err) {
      toast.error(errMsg(err, "Could not update the IB."));
    } finally {
      setConfirmSuspend(false);
    }
  };

  const handleManager = async () => {
    const name = managerInput.trim();
    if (!name) return;
    try {
      await assignManager({ ibId, managerName: name }).unwrap();
      toast.success(`Manager set to ${name}`);
    } catch (err) {
      toast.error(errMsg(err, "Could not assign the manager."));
    }
  };

  const handleOverride = async () => {
    if (!targetTierId) return;
    try {
      await manualOverride({
        ibId,
        body: {
          targetTierId,
          grantBonus,
          reason: reason.trim() || "Manual tier change by admin",
        },
      }).unwrap();
      toast.success("Tier updated");
      setShowTierForm(false);
      setReason("");
    } catch (err) {
      toast.error(errMsg(err, "Could not change the tier."));
    }
  };

  const currentTierObj =
    tiers.find((t) => t.id === d?.currentTierId) ??
    tiers.find((t) => t.name === d?.currentTier);

  const views: { key: View; label: string; count: number }[] = d
    ? [
        {
          key: "clients",
          label: "Referred clients",
          count: d.referredClients.length,
        },
        { key: "ledger", label: "Commission ledger", count: d.ledgers.length },
        {
          key: "withdrawals",
          label: "Withdrawals",
          count: d.withdrawals.length,
        },
        {
          key: "accountTypes",
          label: "By account type",
          count: d.commissionByAccountType.length,
        },
        { key: "bonuses", label: "Tier bonuses", count: d.bonusAwards.length },
      ]
    : [];

  return (
    <DashboardLayout title={d ? `IB: ${d.name}` : "IB Partner"}>
      <main className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {d?.name ?? "IB partner"}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-mono text-muted-foreground">#{ibId}</span>
              {d && (
                <>
                  <Badge className="border border-violet-300 bg-violet-100 text-violet-800 hover:bg-violet-100">
                    {d.currentTier}
                  </Badge>
                  {isSuspended ? (
                    <Badge
                      variant="outline"
                      className="border-red-300 bg-red-100 text-red-800"
                    >
                      Suspended
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-100 text-emerald-800"
                    >
                      Active
                    </Badge>
                  )}
                  {payoutHold && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-100 text-amber-800"
                    >
                      <PauseCircle className="mr-1 h-3 w-3" /> Payout on hold
                    </Badge>
                  )}
                  {d.risk && (
                    <Badge
                      variant="outline"
                      className="border-red-300 bg-red-100 text-red-800"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" /> At risk
                    </Badge>
                  )}
                </>
              )}
              {isFetching && !isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={backToDirectory}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> IB directory
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => navigate(`/clients/${ibId}`)}
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Client profile
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading
            partner…
          </div>
        ) : isError || !d ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load this partner.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Figures */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Kpi
                label="Referred clients"
                value={String(d.summary.totalClients)}
                hint={`${d.summary.activeClients} have traded`}
                icon={Users}
                tone="bg-violet-100 text-violet-600"
              />
              <Kpi
                label="Volume by clients"
                value={`${num(d.summary.tradedLots)} lots`}
                hint={`${num(d.summary.commissionLots)} closed for commission`}
                icon={BarChart3}
                tone="bg-sky-100 text-sky-600"
              />
              <Kpi
                label="Total commission"
                value={usd(d.summary.totalCommission)}
                hint={`This month ${usd(d.summary.thisMonth.commission)}`}
                icon={Coins}
                tone="bg-primary/15 text-primary"
              />
              <Kpi
                label="Withdrawn"
                value={usd(d.summary.withdrawn)}
                hint={
                  d.summary.pendingWithdrawal > 0
                    ? `${usd(d.summary.pendingWithdrawal)} pending`
                    : "Completed payouts"
                }
                icon={ArrowUpRight}
                tone="bg-rose-100 text-rose-600"
              />
              <Kpi
                label="IB wallet"
                value={usd(d.summary.walletBalance)}
                hint="Available to withdraw"
                icon={Wallet}
                tone="bg-emerald-100 text-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Identity */}
              <Card title="Identity">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Email">{d.email}</Field>
                  <Field label="Phone">{d.phone || "—"}</Field>
                  <Field label="Joined">
                    {day(d.joinedAt)}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      ·{" "}
                      {formatDistanceToNow(new Date(d.joinedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </Field>
                  <Field label="KYC">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", KYC_CLS[d.kycStatus])}
                    >
                      {cap(d.kycStatus)}
                    </Badge>
                  </Field>
                  <Field label="Referral code">
                    {d.referralCode ? (
                      <span className="font-mono font-semibold">
                        {d.referralCode}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Field>
                  <Field label="Client login">
                    {d.accountActive ? (
                      <span className="text-emerald-700">Enabled</span>
                    ) : (
                      <span className="text-red-700">Banned</span>
                    )}
                  </Field>
                  <Field label="Assigned manager">
                    {d.assignedManager || (
                      <span className="text-muted-foreground">
                        Not assigned
                      </span>
                    )}
                  </Field>
                </div>
                <div className="flex gap-2 border-t pt-3">
                  <Input
                    placeholder="Manager name"
                    value={managerInput}
                    onChange={(e) => setManagerInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 text-xs"
                    onClick={handleManager}
                    disabled={
                      managerState.isLoading ||
                      !managerInput.trim() ||
                      managerInput.trim() === (d.assignedManager ?? "")
                    }
                  >
                    {managerState.isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserCog className="mr-1 h-3.5 w-3.5" /> Assign
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Tier */}
              <Card
                title="Tier"
                action={
                  d.risk ? (
                    <Badge
                      variant="outline"
                      className="border-red-300 bg-red-100 text-red-800"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" /> At risk
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-300 bg-emerald-100 text-emerald-800"
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" /> In good standing
                    </Badge>
                  )
                }
              >
                <div>
                  <p className="text-lg font-bold text-violet-800">
                    {d.currentTier}
                    {d.tier && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Level {d.tier.levelOrder}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.tierSince ? `Since ${day(d.tierSince)}` : "Entry tier"}
                    {d.tierSource &&
                      ` · ${SOURCE_LABEL[d.tierSource] ?? d.tierSource}`}
                  </p>
                </div>

                {d.risk && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                    Missed this tier's targets since {day(d.risk.since)}.{" "}
                    {d.risk.failedEvaluations} failed evaluation
                    {d.risk.failedEvaluations === 1 ? "" : "s"}
                    {d.risk.graceCycles !== null &&
                      ` of ${d.risk.graceCycles} allowed before downgrade`}
                    .
                  </div>
                )}

                {d.progress && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-muted-foreground">
                      {d.nextTier ? (
                        <>
                          Progress to{" "}
                          <span className="font-semibold text-foreground">
                            {d.nextTier.name}
                          </span>
                          ,{" "}
                          {MODE_LABEL[d.progress.evaluationMode] ??
                            "current period"}
                        </>
                      ) : (
                        <>
                          Highest tier. Keeping it,{" "}
                          {MODE_LABEL[d.progress.evaluationMode] ??
                            "current period"}
                        </>
                      )}
                    </p>
                    {(() => {
                      const goal = d.nextTier ?? d.tier;
                      if (!goal) return null;
                      return (
                        <>
                          <ProgressRow
                            label="Closed volume"
                            value={d.progress.volumeLots}
                            target={goal.minVolumeLots}
                            unit="lots"
                          />
                          <ProgressRow
                            label="Active traders"
                            value={d.progress.activeTraders}
                            target={goal.minActiveTraders}
                            unit=""
                          />
                          <p className="text-[11px] text-muted-foreground">
                            A trader is active with{" "}
                            {num(d.progress.activeTraderMinLots)}+ closed lots
                            in the period.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setShowTierForm((v) => !v)}
                  >
                    Change tier
                  </Button>
                  {currentTierObj && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => onViewRatePlan(currentTierObj)}
                    >
                      View rate plan
                    </Button>
                  )}
                </div>
                {showTierForm && (
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                    <Select
                      value={String(targetTierId)}
                      onValueChange={(v) => setTargetTierId(Number(v))}
                    >
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue placeholder="Target tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name} (Level {t.levelOrder})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Reason (kept in the audit log)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-8 bg-background text-xs"
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={grantBonus}
                        onCheckedChange={(v) => setGrantBonus(v === true)}
                      />
                      Grant the tier's bonus
                    </label>
                    <Button
                      size="sm"
                      className="h-8 w-full text-xs"
                      onClick={handleOverride}
                      disabled={
                        overrideState.isLoading ||
                        !targetTierId ||
                        targetTierId === d.currentTierId
                      }
                    >
                      {overrideState.isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Apply tier"
                      )}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Commission and payouts */}
              <Card
                title="Commission and payouts"
                action={
                  <span
                    className={cn(
                      "text-xs font-bold",
                      payoutHold ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    Payouts {payoutHold ? "on hold" : "enabled"}
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="This month">
                    <span className="font-bold text-primary">
                      {usd(d.summary.thisMonth.commission)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {num(d.summary.thisMonth.lots)} lots
                    </span>
                  </Field>
                  <Field label="Last month">
                    {usd(d.summary.lastMonth.commission)}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {num(d.summary.lastMonth.lots)} lots
                    </span>
                  </Field>
                  <Field label="Paid to IB wallet">
                    {usd(d.summary.paidCommission)}
                  </Field>
                  <Field label="Not yet paid">
                    {usd(
                      d.summary.pendingCommission +
                        d.summary.confirmedCommission,
                    )}
                  </Field>
                  <Field label="Withdrawn">{usd(d.summary.withdrawn)}</Field>
                  <Field label="Withdrawal pending">
                    {usd(d.summary.pendingWithdrawal)}
                  </Field>
                  <Field label="Last payout">
                    {d.lastPayout ? (
                      <>
                        {usd(d.lastPayout.amount)}
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · {day(d.lastPayout.createdAt)}
                        </span>
                      </>
                    ) : (
                      "None yet"
                    )}
                  </Field>
                  <Field label="Payout method">
                    {d.lastPayout?.coin
                      ? `${d.lastPayout.coin}${d.lastPayout.network ? ` · ${d.lastPayout.network}` : ""}`
                      : "—"}
                  </Field>
                </div>
                <div className="space-y-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant={payoutHold ? "default" : "outline"}
                    className={cn(
                      "h-9 w-full text-xs font-semibold",
                      !payoutHold &&
                        "border-amber-300 text-amber-800 hover:bg-amber-50",
                    )}
                    onClick={handleHold}
                    disabled={holdState.isLoading}
                  >
                    {holdState.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : payoutHold ? (
                      <>
                        <PlayCircle className="mr-1.5 h-4 w-4" /> Release payout
                      </>
                    ) : (
                      <>
                        <PauseCircle className="mr-1.5 h-4 w-4" /> Hold payout
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    {payoutHold
                      ? "The IB cannot withdraw from the IB wallet until payouts are released."
                      : "The IB can withdraw from the IB wallet."}
                    {isSuspended &&
                      payoutHold &&
                      " A suspended IB stays blocked until reactivated."}
                  </p>
                </div>
              </Card>

              {/* Account */}
              <Card title="IB account">
                <p className="text-xs text-muted-foreground">
                  {isSuspended
                    ? "Suspended: the IB earns no commission on new trades and cannot withdraw."
                    : "Active: commission is earned on referred clients' closed trades."}
                </p>
                <Button
                  size="sm"
                  variant={isSuspended ? "default" : "destructive"}
                  className="h-9 w-full text-xs font-semibold"
                  onClick={() => setConfirmSuspend(true)}
                  disabled={suspendState.isLoading}
                >
                  {suspendState.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSuspended ? (
                    <>
                      <ShieldCheck className="mr-1.5 h-4 w-4" /> Reactivate IB
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-1.5 h-4 w-4" /> Suspend IB
                    </>
                  )}
                </Button>
                {isSuspended && payoutHold && (
                  <p className="text-[11px] text-muted-foreground">
                    Suspending also put payouts on hold. Reactivating does not
                    release them; use Release payout.
                  </p>
                )}
              </Card>
            </div>

            {/* Detail lists */}
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
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-semibold",
                      view === v.key ? "bg-primary-foreground/20" : "bg-muted",
                    )}
                  >
                    {v.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full text-xs">
                  {view === "clients" && (
                    <>
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className={cn(th, "text-left")}>Client</th>
                          <th className={cn(th, "text-left")}>KYC</th>
                          <th className={cn(th, "text-right")}>Lots traded</th>
                          <th className={cn(th, "text-right")}>Commission</th>
                          <th className={cn(th, "text-right")}>This month</th>
                          <th className={cn(th, "text-right")}>Last month</th>
                          <th className={cn(th, "text-left")}>Last trade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.referredClients.length === 0 ? (
                          <Empty cols={7} text="No referred clients yet" />
                        ) : (
                          d.referredClients.map((c) => (
                            <tr
                              key={c.userId}
                              className="cursor-pointer border-t hover:bg-muted/30"
                              onClick={() => navigate(`/clients/${c.userId}`)}
                            >
                              <td className="px-3 py-2">
                                <div className="font-semibold">
                                  {c.name || "—"}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  #{c.userId} ·{" "}
                                  {c.accountTypes.length
                                    ? c.accountTypes.join(", ")
                                    : "No real account"}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px]",
                                    KYC_CLS[c.kycStatus],
                                  )}
                                >
                                  {cap(c.kycStatus)}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="font-semibold">
                                  {num(c.tradedLots)}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {c.trades} trades
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-primary">
                                {usd(c.commission)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {usd(c.thisMonthCommission)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {usd(c.lastMonthCommission)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                {c.lastTradeAt
                                  ? day(c.lastTradeAt)
                                  : "No trades"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}

                  {view === "ledger" && (
                    <>
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className={cn(th, "text-left")}>Closed</th>
                          <th className={cn(th, "text-left")}>Client</th>
                          <th className={cn(th, "text-left")}>Symbol</th>
                          <th className={cn(th, "text-left")}>Account type</th>
                          <th className={cn(th, "text-right")}>Lots</th>
                          <th className={cn(th, "text-right")}>Rate</th>
                          <th className={cn(th, "text-right")}>Amount</th>
                          <th className={cn(th, "text-left")}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.ledgers.length === 0 ? (
                          <Empty cols={8} text="No commission yet" />
                        ) : (
                          d.ledgers.map((l) => (
                            <tr key={l.id} className="border-t">
                              <td className="whitespace-nowrap px-3 py-2">
                                {format(
                                  new Date(l.closedAt),
                                  "dd MMM yyyy, HH:mm",
                                )}
                              </td>
                              <td className="px-3 py-2 font-medium">
                                {l.clientName ||
                                  (l.clientUserId ? `#${l.clientUserId}` : "—")}
                              </td>
                              <td className="px-3 py-2 font-semibold">
                                {l.symbol}
                              </td>
                              <td className="px-3 py-2">{l.accountType}</td>
                              <td className="px-3 py-2 text-right">{l.lots}</td>
                              <td className="px-3 py-2 text-right">
                                {usd(l.rate)}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-primary">
                                {usd(l.amount)}
                              </td>
                              <td className="px-3 py-2">
                                <StateBadge state={l.state} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}

                  {view === "withdrawals" && (
                    <>
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className={cn(th, "text-left")}>Date</th>
                          <th className={cn(th, "text-right")}>Amount</th>
                          <th className={cn(th, "text-left")}>Coin</th>
                          <th className={cn(th, "text-left")}>
                            Address / Tx hash
                          </th>
                          <th className={cn(th, "text-left")}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.withdrawals.length === 0 ? (
                          <Empty cols={5} text="No IB withdrawals yet" />
                        ) : (
                          d.withdrawals.map((w) => (
                            <tr key={w.id} className="border-t">
                              <td className="whitespace-nowrap px-3 py-2">
                                {format(
                                  new Date(w.createdAt),
                                  "dd MMM yyyy, HH:mm",
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-bold">
                                {usd(w.amount)}
                              </td>
                              <td className="px-3 py-2">
                                {w.coin ?? "—"}
                                {w.network && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · {w.network}
                                  </span>
                                )}
                              </td>
                              <td className="max-w-[260px] px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                <div
                                  className="truncate"
                                  title={w.address ?? undefined}
                                >
                                  {w.address ?? "—"}
                                </div>
                                {w.txHash && (
                                  <div className="truncate" title={w.txHash}>
                                    {w.txHash}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <StateBadge state={w.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}

                  {view === "accountTypes" && (
                    <>
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className={cn(th, "text-left")}>Account type</th>
                          <th className={cn(th, "text-right")}>Clients</th>
                          <th className={cn(th, "text-right")}>Trades</th>
                          <th className={cn(th, "text-right")}>Lots</th>
                          <th className={cn(th, "text-right")}>Avg / lot</th>
                          <th className={cn(th, "text-right")}>Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.commissionByAccountType.length === 0 ? (
                          <Empty cols={6} text="No account types" />
                        ) : (
                          d.commissionByAccountType.map((a) => (
                            <tr key={a.accountTypeId} className="border-t">
                              <td className="px-3 py-2 font-semibold">
                                {a.name}
                                {!a.isActive && (
                                  <span className="ml-1 text-[10px] text-muted-foreground">
                                    (inactive)
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {a.clients}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {a.trades}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {num(a.lots)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {usd(a.avgPerLot)}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-primary">
                                {usd(a.commission)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}

                  {view === "bonuses" && (
                    <>
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className={cn(th, "text-left")}>Earned</th>
                          <th className={cn(th, "text-left")}>Tier</th>
                          <th className={cn(th, "text-right")}>Amount</th>
                          <th className={cn(th, "text-left")}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.bonusAwards.length === 0 ? (
                          <Empty cols={4} text="No tier bonuses yet" />
                        ) : (
                          d.bonusAwards.map((b) => (
                            <tr key={b.id} className="border-t">
                              <td className="px-3 py-2">{day(b.earnedAt)}</td>
                              <td className="px-3 py-2 font-semibold">
                                {b.tierName}
                              </td>
                              <td className="px-3 py-2 text-right font-bold">
                                {usd(b.amount)}
                              </td>
                              <td className="px-3 py-2">
                                <StateBadge state={b.state} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isSuspended ? "Reactivate" : "Suspend"} {d?.name ?? "this IB"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isSuspended
                  ? "The IB earns commission on new closed trades again. Payouts stay on hold until you release them."
                  : "The IB stops earning commission on new trades and payouts are put on hold."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSuspend}
                className={
                  isSuspended
                    ? ""
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }
              >
                {isSuspended ? "Reactivate" : "Suspend"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </DashboardLayout>
  );
}

function Empty({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="py-10 text-center text-xs text-muted-foreground"
      >
        {text}
      </td>
    </tr>
  );
}
