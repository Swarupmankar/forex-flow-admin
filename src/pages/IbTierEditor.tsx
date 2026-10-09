import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetProgrammeQuery,
  useUpdateProgrammeMutation,
  useGetTiersQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
} from "@/API/ibAdmin.api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Clock,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";

const MAX_TIERS = 6;

const EVALUATION_EXPLANATIONS: Record<string, string> = {
  monthly:
    "Calendar month: Evaluated on the 1st of each month using the complete previous calendar month. New tier applies to trades closed after evaluation.",
  rolling:
    "Rolling 30 days: Evaluated daily using the immediately preceding 30 days. Window advances daily.",
  lifetime:
    "Lifetime: Counts all cumulative activity since IB registration. Upgrade-only evaluation model.",
};

const parseBenefits = (text?: string): string[] => {
  if (!text) return ["Priority Support", "Weekly Payouts", "Dedicated Manager"];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(String).filter((s) => s.trim() !== "");
    }
  } catch {
    const parts = text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return text.trim() ? [text.trim()] : ["Priority Support", "Weekly Payouts"];
};

const serializeBenefits = (list: string[]): string => {
  const filtered = list.map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(filtered);
};

// Evaluation settings belong to the programme (one ladder, one mode and
// timezone); auto-downgrade and grace belong to each tier.
const EVAL_MODE_TO_FORM: Record<string, string> = {
  CALENDAR_MONTH: "monthly",
  ROLLING_30_DAYS: "rolling",
  LIFETIME: "lifetime",
};
const FORM_TO_EVAL_MODE: Record<string, "CALENDAR_MONTH" | "ROLLING_30_DAYS" | "LIFETIME"> = {
  monthly: "CALENDAR_MONTH",
  rolling: "ROLLING_30_DAYS",
  lifetime: "LIFETIME",
};
const graceToForm = (cycles?: number) =>
  cycles === 0 ? "none" : cycles && cycles >= 2 ? "2 cycles" : "1 cycle";
const FORM_TO_GRACE: Record<string, number> = { none: 0, "1 cycle": 1, "2 cycles": 2 };

type TierForm = {
  name: string;
  levelOrder: number;
  minVolumeLots: number;
  minActiveTraders: number;
  bonusAmount: number;
  status: "ACTIVE" | "INACTIVE";
  qualificationRule: "BOTH" | "EITHER";
  benefitsList: string[];
  evalPeriod: string;
  timezone: string;
  evalTime: string;
  activeDefinition: string;
  autoUpgrade: boolean;
  autoDowngrade: boolean;
  downgradeGrace: string;
  maxDowngradeStep: string;
  rateStarts: string;
  recovery: string;
  eligibilityTrigger: string;
  bonusTiming: string;
  reEntryBonus: string;
};

// Create a partner tier (/ib-management/tiers/new) or edit one
// (/ib-management/tiers/:tierId/edit). Opened from IB management.
export default function IbTierEditor() {
  const navigate = useNavigate();
  const { tierId: tierIdParam } = useParams();
  const isEdit = tierIdParam !== undefined;
  const tierId = Number(tierIdParam);
  const backToTiers = () => navigate("/ib-management?tab=tiers");

  const { data: programmeData, isLoading: isProgLoading } = useGetProgrammeQuery();
  const { data: tiersData, isLoading: isTiersLoading, isFetching: isTiersFetching } = useGetTiersQuery();
  const tiers = tiersData?.data ?? [];
  const selectedTier = isEdit ? tiers.find((t) => t.id === tierId) ?? null : null;

  const [createTier, { isLoading: isCreating }] = useCreateTierMutation();
  const [updateTier, { isLoading: isUpdating }] = useUpdateTierMutation();
  const [updateProgramme, { isLoading: isUpdatingProgramme }] = useUpdateProgrammeMutation();
  const isSaving = isCreating || isUpdating || isUpdatingProgramme;

  const [tierForm, setTierForm] = useState<TierForm | null>(null);

  // Fill the form once, when the tiers and the programme are known; a later
  // refetch must not wipe what the admin has typed.
  useEffect(() => {
    if (tierForm || isProgLoading || isTiersLoading) return;
    const prog = programmeData?.data;
    const programmeForm = {
      evalPeriod: EVAL_MODE_TO_FORM[prog?.evaluationMode ?? "CALENDAR_MONTH"] ?? "monthly",
      timezone: prog?.timezone || "Asia/Kolkata",
      evalTime: prog?.evaluationTime || "00:05",
      activeDefinition: Number(prog?.activeTraderMinLots ?? 1) > 0 ? "lot" : "trade",
    };

    if (isEdit) {
      if (!selectedTier) return;
      setTierForm({
        name: selectedTier.name,
        levelOrder: selectedTier.levelOrder,
        minVolumeLots: selectedTier.minVolumeLots,
        minActiveTraders: selectedTier.minActiveTraders,
        bonusAmount: selectedTier.bonusAmount,
        status: selectedTier.status,
        qualificationRule: selectedTier.qualificationRule,
        benefitsList: parseBenefits(selectedTier.bonusBenefitsText),
        ...programmeForm,
        autoUpgrade: true,
        autoDowngrade: selectedTier.autoDowngradeEnabled ?? true,
        downgradeGrace: graceToForm(selectedTier.downgradeGraceCycles),
        maxDowngradeStep: "one_tier",
        rateStarts: "effective",
        recovery: "clear_flag",
        eligibilityTrigger: "effective",
        bonusTiming: selectedTier.bonusTiming || "5 business days",
        reEntryBonus: "no_repay",
      });
    } else {
      setTierForm({
        name: "",
        levelOrder: Math.min(MAX_TIERS, tiers.length + 1),
        minVolumeLots: 500,
        minActiveTraders: 5,
        bonusAmount: 500,
        status: "ACTIVE",
        qualificationRule: "BOTH",
        benefitsList: ["Priority Support", "Weekly Payouts", "Dedicated Partner Manager"],
        ...programmeForm,
        autoUpgrade: true,
        autoDowngrade: true,
        downgradeGrace: "1 cycle",
        maxDowngradeStep: "one_tier",
        rateStarts: "effective",
        recovery: "clear_flag",
        eligibilityTrigger: "effective",
        bonusTiming: "5 business days",
        reEntryBonus: "no_repay",
      });
    }
  }, [tierForm, isProgLoading, isTiersLoading, programmeData, isEdit, selectedTier, tiers.length]);

  const handleSaveTier = async () => {
    if (!tierForm) return;
    try {
      if (!isEdit && tiers.length >= MAX_TIERS) {
        toast.error("Maximum 6 tiers allowed");
        return;
      }
      if (tierForm.levelOrder > 6 || tierForm.levelOrder < 1) {
        toast.error("Level Rank must be between 1 and 6");
        return;
      }
      const body = {
        name: tierForm.name,
        levelOrder: Number(tierForm.levelOrder),
        minVolumeLots: Number(tierForm.minVolumeLots),
        minActiveTraders: Number(tierForm.minActiveTraders),
        bonusAmount: Number(tierForm.bonusAmount),
        status: tierForm.status,
        qualificationRule: tierForm.qualificationRule,
        bonusBenefitsText: serializeBenefits(tierForm.benefitsList),
        bonusTiming: tierForm.bonusTiming,
        autoDowngradeEnabled: tierForm.autoDowngrade,
        downgradeGraceCycles: FORM_TO_GRACE[tierForm.downgradeGrace] ?? 1,
      };

      // Programme-wide evaluation settings, saved only when changed
      const prog = programmeData?.data;
      const currentMinLots = Number(prog?.activeTraderMinLots ?? 1);
      const programmeChanges: Record<string, unknown> = {};
      const mode = FORM_TO_EVAL_MODE[tierForm.evalPeriod];
      if (mode && mode !== prog?.evaluationMode) programmeChanges.evaluationMode = mode;
      if (tierForm.timezone && tierForm.timezone !== prog?.timezone) programmeChanges.timezone = tierForm.timezone;
      if (tierForm.evalTime && tierForm.evalTime !== prog?.evaluationTime) programmeChanges.evaluationTime = tierForm.evalTime;
      const minLots = tierForm.activeDefinition === "trade" ? 0 : currentMinLots > 0 ? currentMinLots : 1;
      if (minLots !== currentMinLots) programmeChanges.activeTraderMinLots = minLots;

      // Stays on the page. A new tier moves to its edit page straight away, so
      // saving again updates it rather than creating a second one; the form
      // keeps what was typed.
      if (selectedTier) {
        await updateTier({ tierId: selectedTier.id, body }).unwrap();
        toast.success("Tier configuration saved");
      } else {
        const res = await createTier(body).unwrap();
        navigate(`/ib-management/tiers/${res.data.id}/edit`, { replace: true });
        toast.success("New partner tier created");
      }
      if (Object.keys(programmeChanges).length > 0) {
        await updateProgramme(programmeChanges as any).unwrap();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to save tier. Please try again.");
    }
  };

  const title = isEdit ? `Edit Tier${selectedTier ? `: ${selectedTier.name}` : ""}` : "Configure New Partner Tier";

  const notice = (message: string) => (
    <DashboardLayout title="IB Partner Tier">
      <div className="max-w-7xl mx-auto">
        <Card className="border-border/80">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" size="sm" onClick={backToTiers} className="text-xs">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to IB tiers
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );

  if (!isTiersLoading && !isTiersFetching && isEdit && !selectedTier) {
    return notice("This partner tier was not found. It may have been deleted.");
  }
  if (!isTiersLoading && !isTiersFetching && !isEdit && tiers.length >= MAX_TIERS) {
    return notice("Maximum 6 tiers allowed. Delete a tier before adding another.");
  }

  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={backToTiers} className="h-9 text-xs">
        Cancel
      </Button>
      <Button size="sm" onClick={handleSaveTier} disabled={!tierForm || isSaving} className="h-9 text-xs gap-1.5">
        {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        Save Tier Configuration
      </Button>
    </>
  );

  return (
    <DashboardLayout title={title}>
      <div className="space-y-6 max-w-7xl mx-auto pb-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shrink-0">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define qualification thresholds, evaluation rules, upgrade/downgrade logic, and cash bonus perks.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={backToTiers} className="h-9 text-xs">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> IB tiers
            </Button>
            <Button size="sm" onClick={handleSaveTier} disabled={!tierForm || isSaving} className="h-9 text-xs gap-1.5">
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Save Tier Configuration
            </Button>
          </div>
        </div>

        {!tierForm ? (
          <div className="py-12 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading tier configuration...
          </div>
        ) : (
          <>
            {/* Section 1: Tier Requirements */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-primary" /> 1. Basic Information & Requirement Thresholds
                </h3>
                <Badge variant="outline" className="text-[10px]">Required</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tier Name</label>
                  <Input
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                    placeholder="e.g. Master Partner"
                    className="text-xs h-9 bg-background border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Level Rank (1 - 6)</label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={tierForm.levelOrder}
                    onChange={(e) => setTierForm({ ...tierForm, levelOrder: Math.min(6, Math.max(1, Number(e.target.value))) })}
                    className="text-xs h-9 bg-background border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Minimum Monthly Volume (Closed Lots)</label>
                  <Input
                    type="number"
                    value={tierForm.minVolumeLots}
                    onChange={(e) => setTierForm({ ...tierForm, minVolumeLots: Number(e.target.value) })}
                    className="text-xs h-9 bg-background border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Minimum Active Traders (Clients)</label>
                  <Input
                    type="number"
                    value={tierForm.minActiveTraders}
                    onChange={(e) => setTierForm({ ...tierForm, minActiveTraders: Number(e.target.value) })}
                    className="text-xs h-9 bg-background border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Qualification Rule</label>
                  <Select
                    value={tierForm.qualificationRule}
                    onValueChange={(val: any) => setTierForm({ ...tierForm, qualificationRule: val })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOTH">Meet BOTH requirements</SelectItem>
                      <SelectItem value="EITHER">Meet EITHER requirement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Status</label>
                  <Select
                    value={tierForm.status}
                    onValueChange={(val: any) => setTierForm({ ...tierForm, status: val })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active Tier</SelectItem>
                      <SelectItem value="INACTIVE">Inactive Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Evaluation Period */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" /> 2. Evaluation Window & Execution Schedule
                </h3>
                <Badge variant="outline" className="text-[10px]">Automated Schedule</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Evaluation Window</label>
                  <Select
                    value={tierForm.evalPeriod}
                    onValueChange={(v) => setTierForm({ ...tierForm, evalPeriod: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Calendar Month</SelectItem>
                      <SelectItem value="rolling">Rolling 30 Days</SelectItem>
                      <SelectItem value="lifetime">Lifetime Cumulative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Timezone</label>
                  <Select
                    value={tierForm.timezone}
                    onValueChange={(v) => setTierForm({ ...tierForm, timezone: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC Standard</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia / Kolkata (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Execution Time</label>
                  <Input
                    type="time"
                    value={tierForm.evalTime}
                    onChange={(e) => setTierForm({ ...tierForm, evalTime: e.target.value })}
                    className="text-xs h-9 bg-background border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Active Trader Rule</label>
                  <Select
                    value={tierForm.activeDefinition}
                    onValueChange={(v) => setTierForm({ ...tierForm, activeDefinition: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lot">Min 1 closed lot/month</SelectItem>
                      <SelectItem value="trade">Min 1 closed trade/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-blue-500/10 border-blue-500/20 text-xs text-blue-600 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{EVALUATION_EXPLANATIONS[tierForm.evalPeriod]}</div>
              </div>
            </div>

            {/* Section 3: Upgrade and Downgrade Handling */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" /> 3. Tier Upgrade & Grace Period Logic
                </h3>
                <Badge variant="outline" className="text-[10px]">At-Risk Protection</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 border border-border/60 rounded-xl p-3 bg-background text-xs cursor-pointer hover:border-primary/40 transition-colors">
                  <Checkbox
                    checked={tierForm.autoUpgrade}
                    onCheckedChange={(c) => setTierForm({ ...tierForm, autoUpgrade: Boolean(c) })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-foreground">Automatic Tier Upgrades</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Promote IBs immediately upon meeting tier requirements during monthly evaluation.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 border border-border/60 rounded-xl p-3 bg-background text-xs cursor-pointer hover:border-primary/40 transition-colors">
                  <Checkbox
                    checked={tierForm.autoDowngrade}
                    onCheckedChange={(c) => setTierForm({ ...tierForm, autoDowngrade: Boolean(c) })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-bold text-foreground">Automatic Tier Downgrades</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Flag IBs as At Risk when monthly targets fall below current tier requirements.
                    </div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Downgrade Grace</label>
                  <Select
                    value={tierForm.downgradeGrace}
                    onValueChange={(v) => setTierForm({ ...tierForm, downgradeGrace: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 cycle">1 Full Month Grace</SelectItem>
                      <SelectItem value="2 cycles">2 Months Grace</SelectItem>
                      <SelectItem value="none">No Grace Period</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Max Downgrade Step</label>
                  <Select
                    value={tierForm.maxDowngradeStep}
                    onValueChange={(v) => setTierForm({ ...tierForm, maxDowngradeStep: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_tier">1 Tier per Month</SelectItem>
                      <SelectItem value="immediate">Direct to Qualified Tier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">New Rate Effective</label>
                  <Select
                    value={tierForm.rateStarts}
                    onValueChange={(v) => setTierForm({ ...tierForm, rateStarts: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="effective">Next Closed Trade</SelectItem>
                      <SelectItem value="next_month">Next Calendar Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Grace Recovery Rule</label>
                  <Select
                    value={tierForm.recovery}
                    onValueChange={(v) => setTierForm({ ...tierForm, recovery: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear_flag">Clear At-Risk Flag</SelectItem>
                      <SelectItem value="reevaluate">Recalculate Immediately</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 4: One-Time Bonus & Dynamic Perks */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-500" /> 4. One-Time Cash Reward & Custom Perks
                </h3>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/10">Cash Incentives</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">One-Time Cash Bonus ($)</label>
                  <Input
                    type="number"
                    min={0}
                    value={tierForm.bonusAmount}
                    onChange={(e) => setTierForm({ ...tierForm, bonusAmount: Math.max(0, Number(e.target.value)) })}
                    placeholder="0 for no bonus"
                    className="text-xs h-9 bg-background border-border/60 font-semibold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Eligibility Trigger</label>
                  <Select
                    value={tierForm.eligibilityTrigger}
                    onValueChange={(v) => setTierForm({ ...tierForm, eligibilityTrigger: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="effective">On Tier Qualification</SelectItem>
                      <SelectItem value="manual">Manual Admin Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Payment Schedule</label>
                  <Select
                    value={tierForm.bonusTiming}
                    onValueChange={(v) => setTierForm({ ...tierForm, bonusTiming: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5 business days">Within 5 Business Days</SelectItem>
                      <SelectItem value="monthly">Next Monthly Payout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Re-entry After Downgrade</label>
                  <Select
                    value={tierForm.reEntryBonus}
                    onValueChange={(v) => setTierForm({ ...tierForm, reEntryBonus: v })}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_repay">One-Time Only (No Re-pay)</SelectItem>
                      <SelectItem value="repay">Allow Re-earning Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Benefits List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Additional Tier Benefits & Partner Perks</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-border/60"
                    onClick={() => setTierForm({ ...tierForm, benefitsList: [...tierForm.benefitsList, ""] })}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Benefit
                  </Button>
                </div>
                <div className="space-y-2 p-2 border border-border/60 rounded-xl bg-background">
                  {tierForm.benefitsList.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => {
                          const updated = [...tierForm.benefitsList];
                          updated[idx] = e.target.value;
                          setTierForm({ ...tierForm, benefitsList: updated });
                        }}
                        placeholder={`e.g. Dedicated Account Manager, Priority Support, Branded Merchandise...`}
                        className="text-xs h-8 bg-muted/20"
                      />
                      {tierForm.benefitsList.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => {
                            const updated = tierForm.benefitsList.filter((_, i) => i !== idx);
                            setTierForm({ ...tierForm, benefitsList: updated });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom actions, so the form does not need scrolling back up */}
            <div className="flex justify-end gap-2">{actions}</div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
