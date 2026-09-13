import { useState, useEffect } from "react";
import {
  useGetProgrammeQuery,
  useGetTiersQuery,
  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
  useDeleteTierMutation,
  useGetTierRatesQuery,
  usePublishTierRatesMutation,
  useManualTierOverrideMutation,
  useAssignManagerMutation,
  useTogglePayoutHoldMutation,
  useSuspendPartnerMutation,
  IbTier,
  IbPartnerItem,
} from "@/API/ibAdmin.api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users,
  Award,
  Layers,
  Edit,
  Trash2,
  Settings,
  Eye,
  ShieldAlert,
  Clock,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Info,
  SlidersHorizontal,
  DollarSign,
  BarChart3,
  Sparkles,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";

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

const DEFAULT_36_SYMBOLS: Array<{
  symbolId: string;
  category: "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES";
  rates: { [acc: string]: number };
}> = [
  // 1. Forex Majors (7)
  { symbolId: "EURUSD", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "GBPUSD", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "USDJPY", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "USDCHF", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "USDCAD", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "AUDUSD", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },
  { symbolId: "NZDUSD", category: "MAJORS", rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 } },

  // 2. Forex Minors & Crosses (21)
  { symbolId: "EURGBP", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "EURJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "EURCHF", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "EURCAD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "EURAUD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "EURNZD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "GBPJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "GBPCHF", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "GBPCAD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "GBPAUD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "GBPNZD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "AUDJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "AUDCHF", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "AUDCAD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "AUDNZD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "NZDJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "NZDCHF", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "NZDCAD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "CADJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "CHFJPY", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },
  { symbolId: "CHFCAD", category: "MINORS", rates: { STANDARD: 10.0, PRO: 8.5, RAW: 6.5, ZERO: 7.0 } },

  // 3. Precious Metals (3)
  { symbolId: "XAUUSD", category: "METALS", rates: { STANDARD: 13.75, PRO: 11.25, RAW: 8.4, ZERO: 9.4 } },
  { symbolId: "XAGUSD", category: "METALS", rates: { STANDARD: 11.0, PRO: 9.5, RAW: 7.0, ZERO: 8.0 } },
  { symbolId: "XPTUSD", category: "METALS", rates: { STANDARD: 12.0, PRO: 10.0, RAW: 7.5, ZERO: 8.5 } },

  // 4. Energies / Gas & Oil (2)
  { symbolId: "WTIUSD", category: "ENERGIES", rates: { STANDARD: 12.0, PRO: 10.0, RAW: 7.5, ZERO: 8.5 } },
  { symbolId: "XNG/USD", category: "ENERGIES", rates: { STANDARD: 12.0, PRO: 10.0, RAW: 7.5, ZERO: 8.5 } },

  // 5. Indices (3)
  { symbolId: "US30", category: "INDICES", rates: { STANDARD: 15.0, PRO: 12.5, RAW: 9.4, ZERO: 10.5 } },
  { symbolId: "US500", category: "INDICES", rates: { STANDARD: 15.0, PRO: 12.5, RAW: 9.4, ZERO: 10.5 } },
  { symbolId: "NAS100", category: "INDICES", rates: { STANDARD: 15.0, PRO: 12.5, RAW: 9.4, ZERO: 10.5 } },
];

const getSymbolCategory = (sym: string): "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES" => {
  const match = DEFAULT_36_SYMBOLS.find((s) => s.symbolId === sym);
  if (match) return match.category;
  if (sym.includes("XAU") || sym.includes("XAG") || sym.includes("XPT")) return "METALS";
  if (sym.includes("OIL") || sym.includes("WTI") || sym.includes("NG")) return "ENERGIES";
  if (sym.includes("US") || sym.includes("NAS") || sym.includes("GER") || sym.includes("UK")) return "INDICES";
  if (["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "USDCAD", "AUDUSD", "NZDUSD"].includes(sym)) return "MAJORS";
  return "MINORS";
};

export default function IBManagement() {
  const [activeTab, setActiveTab] = useState<"tiers" | "partners">("tiers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // RTK Query Hooks
  const { data: programmeData, isLoading: isProgLoading, refetch: refetchProg } = useGetProgrammeQuery();
  const { data: tiersData, isLoading: isTiersLoading, refetch: refetchTiers } = useGetTiersQuery();
  const { data: partnersData, isLoading: isPartnersLoading, refetch: refetchPartners } = useGetPartnersQuery({
    page: 1,
    limit: 50,
  });

  const [createTier] = useCreateTierMutation();
  const [updateTier] = useUpdateTierMutation();
  const [deleteTier] = useDeleteTierMutation();
  const [publishTierRates] = usePublishTierRatesMutation();
  const [manualOverride] = useManualTierOverrideMutation();
  const [assignManager] = useAssignManagerMutation();
  const [togglePayoutHold] = useTogglePayoutHoldMutation();
  const [suspendPartner] = useSuspendPartnerMutation();

  // Tier Modal State
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<IbTier | null>(null);
  const [tierForm, setTierForm] = useState({
    name: "",
    levelOrder: 1,
    minVolumeLots: 0,
    minActiveTraders: 0,
    bonusAmount: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    qualificationRule: "BOTH" as "BOTH" | "EITHER",
    benefitsList: ["Priority Support", "Weekly Payouts"],
    evalPeriod: "monthly",
    timezone: "UTC",
    evalTime: "00:05",
    activeDefinition: "lot",
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

  // Rates Publisher Modal State
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [editingRatesTier, setEditingRatesTier] = useState<IbTier | null>(null);
  const [changeReason, setChangeReason] = useState("Scheduled tier rate update");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 16));
  const [accountEligibility, setAccountEligibility] = useState<{ [key: string]: boolean }>({
    STANDARD: true,
    PRO: true,
    RAW: true,
    ZERO: false,
  });

  const { data: tierRatesData, refetch: refetchTierRates } = useGetTierRatesQuery(
    editingRatesTier?.id ?? 0,
    { skip: !editingRatesTier }
  );

  const [symbolCategoryFilter, setSymbolCategoryFilter] = useState<
    "ALL" | "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES"
  >("ALL");
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");

  const [symbolRatesRows, setSymbolRatesRows] = useState<
    Array<{ symbolId: string; category: "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES"; rates: { [acc: string]: number } }>
  >(DEFAULT_36_SYMBOLS);

  useEffect(() => {
    if (editingRatesTier && tierRatesData?.data?.activeVersion) {
      const activeVer = tierRatesData.data.activeVersion;

      if (Array.isArray(activeVer.accountTypes) && activeVer.accountTypes.length > 0) {
        const eligMap: Record<string, boolean> = { STANDARD: true, PRO: true, RAW: true, ZERO: true };
        activeVer.accountTypes.forEach((a: any) => {
          eligMap[a.accountTypeId.toUpperCase()] = a.isEligible;
        });
        setAccountEligibility(eligMap);
      }

      if (Array.isArray(activeVer.symbolRates) && activeVer.symbolRates.length > 0) {
        const symbolMap: Record<string, Record<string, number>> = {};
        activeVer.symbolRates.forEach((sr: any) => {
          const sym = sr.symbolId.toUpperCase();
          const acc = sr.accountTypeId.toUpperCase();
          if (!symbolMap[sym]) symbolMap[sym] = { STANDARD: 0, PRO: 0, RAW: 0, ZERO: 0 };
          symbolMap[sym][acc] = Number(sr.ratePerClosedLot);
        });

        const newRows = Object.entries(symbolMap).map(([symId, rates]) => ({
          symbolId: symId,
          category: getSymbolCategory(symId),
          rates,
        }));

        setSymbolRatesRows(newRows);
      }
    }
  }, [editingRatesTier, tierRatesData]);

  // Add Symbol Modal State
  const [addSymbolModalOpen, setAddSymbolModalOpen] = useState(false);
  const [newSymbolForm, setNewSymbolForm] = useState<{
    symbolId: string;
    category: "MAJORS" | "MINORS" | "METALS" | "ENERGIES" | "INDICES";
    rates: { STANDARD: number; PRO: number; RAW: number; ZERO: number };
  }>({
    symbolId: "",
    category: "MAJORS",
    rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 },
  });

  // Delete Symbol Confirmation Modal State
  const [deleteSymbolModalOpen, setDeleteSymbolModalOpen] = useState(false);
  const [symbolToDelete, setSymbolToDelete] = useState<string | null>(null);

  // Delete Tier Confirmation Modal State
  const [deleteTierModalOpen, setDeleteTierModalOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<IbTier | null>(null);

  const handleOpenAddSymbol = () => {
    setNewSymbolForm({
      symbolId: "",
      category: "MAJORS",
      rates: { STANDARD: 9.0, PRO: 7.5, RAW: 5.6, ZERO: 6.3 },
    });
    setAddSymbolModalOpen(true);
  };

  const handleConfirmAddSymbol = () => {
    const cleanId = newSymbolForm.symbolId.trim().toUpperCase();
    if (!cleanId) {
      toast.error("Please enter a valid symbol ticker");
      return;
    }
    if (symbolRatesRows.some((r) => r.symbolId === cleanId)) {
      toast.error(`Symbol '${cleanId}' is already in your rate card`);
      return;
    }
    setSymbolRatesRows([
      ...symbolRatesRows,
      {
        symbolId: cleanId,
        category: newSymbolForm.category,
        rates: { ...newSymbolForm.rates },
      },
    ]);
    toast.success("Trading pair added successfully");
    setAddSymbolModalOpen(false);
  };

  const handleConfirmDeleteSymbol = () => {
    if (!symbolToDelete) return;
    setSymbolRatesRows(symbolRatesRows.filter((r) => r.symbolId !== symbolToDelete));
    toast.success("Trading pair removed");
    setSymbolToDelete(null);
    setDeleteSymbolModalOpen(false);
  };

  const handleOpenDeleteTier = (tier: IbTier) => {
    setTierToDelete(tier);
    setDeleteTierModalOpen(true);
  };

  const handleConfirmDeleteTier = async () => {
    if (!tierToDelete) return;
    try {
      await deleteTier(tierToDelete.id).unwrap();
      toast.success("Partner tier deleted");
      setTierToDelete(null);
      setDeleteTierModalOpen(false);
      refetchTiers();
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to delete tier. Please try again.");
    }
  };

  // Partner Detail Modal State
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<IbPartnerItem | null>(null);
  const [partnerModalTab, setPartnerModalTab] = useState<"overview" | "clients" | "transactions" | "actions">("overview");
  const [overrideTierId, setOverrideTierId] = useState<number>(0);
  const [grantBonusCheck, setGrantBonusCheck] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [managerInput, setManagerInput] = useState("");

  const [showChangeTierInline, setShowChangeTierInline] = useState(false);
  const [showLedgerDrawer, setShowLedgerDrawer] = useState(false);
  const [showAllClientsDrawer, setShowAllClientsDrawer] = useState(false);
  const [showAssignManagerInline, setShowAssignManagerInline] = useState(false);
  const [adminNoteText, setAdminNoteText] = useState("Quarterly account review completed. No commission disputes.");

  const { data: partnerDetailData, isLoading: isPartnerDetailLoading, refetch: refetchPartnerDetail } = useGetPartnerByIdQuery(
    selectedPartner?.ibUserId ?? 0,
    { skip: !selectedPartner || !partnerModalOpen }
  );

  const handleOpenAddTier = () => {
    const currentCount = tiersData?.data?.length || 0;
    if (currentCount >= 6) {
      toast.error("Maximum 6 tiers allowed");
      return;
    }
    setSelectedTier(null);
    setTierForm({
      name: "",
      levelOrder: currentCount + 1,
      minVolumeLots: 500,
      minActiveTraders: 5,
      bonusAmount: 500,
      status: "ACTIVE",
      qualificationRule: "BOTH",
      benefitsList: ["Priority Support", "Weekly Payouts", "Dedicated Partner Manager"],
      evalPeriod: "monthly",
      timezone: "UTC",
      evalTime: "00:05",
      activeDefinition: "lot",
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
    setTierModalOpen(true);
  };

  const handleOpenEditTier = (tier: IbTier) => {
    setSelectedTier(tier);
    setTierForm({
      name: tier.name,
      levelOrder: tier.levelOrder,
      minVolumeLots: tier.minVolumeLots,
      minActiveTraders: tier.minActiveTraders,
      bonusAmount: tier.bonusAmount,
      status: tier.status,
      qualificationRule: tier.qualificationRule,
      benefitsList: parseBenefits(tier.bonusBenefitsText),
      evalPeriod: "monthly",
      timezone: "UTC",
      evalTime: "00:05",
      activeDefinition: "lot",
      autoUpgrade: true,
      autoDowngrade: true,
      downgradeGrace: "1 cycle",
      maxDowngradeStep: "one_tier",
      rateStarts: "effective",
      recovery: "clear_flag",
      eligibilityTrigger: "effective",
      bonusTiming: tier.bonusTiming || "5 business days",
      reEntryBonus: "no_repay",
    });
    setTierModalOpen(true);
  };

  const handleSaveTier = async () => {
    try {
      if (!selectedTier && (tiersData?.data?.length || 0) >= 6) {
        toast.error("Maximum 6 tiers allowed");
        return;
      }
      if (tierForm.levelOrder > 6 || tierForm.levelOrder < 1) {
        toast.error("Level Rank must be between 1 and 6");
        return;
      }
      const body = {
        name: tierForm.name,
        levelOrder: tierForm.levelOrder,
        minVolumeLots: tierForm.minVolumeLots,
        minActiveTraders: tierForm.minActiveTraders,
        bonusAmount: tierForm.bonusAmount,
        status: tierForm.status,
        qualificationRule: tierForm.qualificationRule,
        bonusBenefitsText: serializeBenefits(tierForm.benefitsList),
        bonusTiming: tierForm.bonusTiming,
      };

      if (selectedTier) {
        await updateTier({ tierId: selectedTier.id, body }).unwrap();
        toast.success("Tier configuration saved");
      } else {
        await createTier(body).unwrap();
        toast.success("New partner tier created");
      }
      setTierModalOpen(false);
      refetchTiers();
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to save tier. Please try again.");
    }
  };

  const handleOpenManageRates = (tier: IbTier) => {
    setEditingRatesTier(tier);
    setEffectiveFrom(new Date().toISOString().slice(0, 16));
    setRatesModalOpen(true);
  };

  const handlePublishRates = async () => {
    if (!editingRatesTier) return;
    try {
      const accountTypes = Object.entries(accountEligibility).map(([acc, isEligible]) => ({
        accountTypeId: acc,
        isEligible,
      }));

      const symbolRates = symbolRatesRows.map((row) => ({
        symbolId: row.symbolId,
        accountRates: row.rates,
      }));

      await publishTierRates({
        tierId: editingRatesTier.id,
        body: {
          effectiveFrom,
          changeReason,
          accountTypes,
          symbolRates,
        },
      }).unwrap();

      toast.success("Commission rate card published successfully");
      refetchTierRates();
      refetchTiers();
      setRatesModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to publish rates. Please try again.");
    }
  };

  const handleManualOverride = async () => {
    if (!selectedPartner || !overrideTierId) return;
    try {
      await manualOverride({
        ibId: selectedPartner.ibUserId,
        body: {
          targetTierId: overrideTierId,
          grantBonus: grantBonusCheck,
          reason: overrideReason || "Manual administrative override",
        },
      }).unwrap();
      toast.success("Partner tier override applied");
      setPartnerModalOpen(false);
      refetchPartners();
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to apply override. Please try again.");
    }
  };

  const [assignManagerMutation] = useAssignManagerMutation();
  const [togglePayoutHoldMutation] = useTogglePayoutHoldMutation();

  const handleAssignManager = async () => {
    if (!selectedPartner || !managerInput.trim()) return;
    try {
      await assignManagerMutation({
        ibId: selectedPartner.ibUserId,
        managerName: managerInput.trim(),
      }).unwrap();
      toast.success(`Manager '${managerInput.trim()}' assigned successfully`);
      refetchPartners();
      refetchPartnerDetail();
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to assign manager.");
    }
  };

  const handleTogglePayoutHold = async () => {
    if (!selectedPartner) return;
    const newHoldState = !selectedPartner.payoutHold;
    try {
      await togglePayoutHoldMutation({
        ibId: selectedPartner.ibUserId,
        hold: newHoldState,
        reason: newHoldState ? "Administrative payout hold applied" : "Payout hold released",
      }).unwrap();
      toast.success(newHoldState ? "Payout hold applied" : "Payout hold released");
      refetchPartners();
      refetchPartnerDetail();
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to update payout hold state.");
    }
  };

  const handleToggleSuspend = async (partner: IbPartnerItem) => {
    const actionStr = partner.isSuspended ? "reactivate" : "suspend";
    if (!confirm(`Are you sure you want to ${actionStr} IB partner ${partner.name}?`)) return;
    try {
      await suspendPartner({
        ibId: partner.ibUserId,
        suspend: !partner.isSuspended,
        reason: `Admin ${actionStr} action`,
      }).unwrap();
      toast.success(`Partner account updated`);
      refetchPartners();
      refetchPartnerDetail();
    } catch (err: any) {
      toast.error(err?.data?.message || `Unable to ${actionStr} partner account.`);
    }
  };


  const tiers = tiersData?.data || [];
  const rawPartners = partnersData?.data?.partners || [];

  const filteredPartners = rawPartners.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referralCode && p.referralCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !p.isSuspended) ||
      (statusFilter === "SUSPENDED" && p.isSuspended) ||
      (statusFilter === "PENDING" && p.isAtRisk);

    const matchTier = tierFilter === "ALL" || p.currentTier === tierFilter;

    return matchSearch && matchStatus && matchTier;
  });

  // Summary Metrics
  const totalPartners = rawPartners.length;
  const activePartners = rawPartners.filter((p) => !p.isSuspended).length;
  const mtdVolume = rawPartners.reduce((acc, p) => acc + (p.mtdLots || 0), 0);
  const pendingPayouts = rawPartners.reduce((acc, p) => acc + (p.pendingPayout || 0), 0);
  const needsReview = rawPartners.filter((p) => p.isAtRisk || p.payoutHold || p.isSuspended).length;

  return (
    <DashboardLayout title="IB & Tier Administration">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shrink-0">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">IB & Partner Tier Engine</h1>
                <Badge variant="outline" className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                  v2.4 Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Configure partner tier structures, set USD lot commission rate cards by symbol, and manage IB accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchTiers();
                refetchPartners();
              }}
              className="gap-1.5 text-xs h-9 border-border/80"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Data
            </Button>
            <Button
              onClick={handleOpenAddTier}
              size="sm"
              className="gap-1.5 text-xs h-9 shadow-sm"
              disabled={tiers.length >= 6}
            >
              <Plus className="h-4 w-4" />
              Add Partner Tier {tiers.length >= 6 ? "(Max 6)" : ""}
            </Button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-border/60 pb-1">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveTab("tiers")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "tiers"
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              Partner Tiers ({tiers.length}/6)
            </button>
            <button
              onClick={() => setActiveTab("partners")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                activeTab === "partners"
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              IB Directory ({totalPartners})
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-medium hidden md:block">
            {activeTab === "tiers" ? "Maximum 6 tiers configured" : `${filteredPartners.length} IB partners filtered`}
          </div>
        </div>

        {/* TAB 1: TIERS MANAGEMENT */}
        {activeTab === "tiers" && (
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20 border-b border-border/40">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Active Partner Tiers & Qualification Criteria
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Define qualification thresholds, cash rewards, connected trading account types, and symbol commission cards.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold border border-border/60">
                  {tiers.length} / 6 Tiers Active
                </Badge>
              </CardHeader>

              <CardContent className="p-0">
                {isTiersLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading tier configurations...
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tier Level</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qualification Rules</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Types</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Symbols</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Assigned IBs</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiers.map((tier) => {
                        const assignedIbCount = rawPartners.filter(
                          (p) => p.currentTier === tier.name || p.currentTierId === tier.id
                        ).length;

                        return (
                          <TableRow key={tier.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                                  L{tier.levelOrder}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-foreground">{tier.name}</div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-foreground">
                                  {Number(tier.minVolumeLots).toLocaleString()} Lots <span className="text-muted-foreground font-normal">·</span> {tier.minActiveTraders} Active Clients
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                  {tier.qualificationRule === "BOTH" ? "Must meet BOTH requirements" : "Must meet EITHER requirement"}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Standard
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  Pro
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  Raw Spread
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Zero
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-muted/60 text-foreground border border-border/40">
                                {symbolRatesRows.length} Symbols
                              </span>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="font-bold text-xs text-foreground">{assignedIbCount} IBs</div>
                              <div className="text-[10px] text-muted-foreground">Active Partners</div>
                            </TableCell>



                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${tier.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                                <span className="text-xs font-semibold text-foreground">
                                  {tier.status === "ACTIVE" ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenManageRates(tier)}
                                  className="h-8 px-3 text-xs font-semibold gap-1.5 border border-primary/30 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-sm"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  Rates
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditTier(tier)}
                                  className="h-8 px-3 text-xs font-semibold gap-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-200 shadow-sm"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDeleteTier(tier)}
                                  className="h-8 w-8 p-0 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all duration-200 shadow-sm"
                                  title="Delete Tier"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PARTNERS DIRECTORY */}
        {activeTab === "partners" && (
          <div className="space-y-6">
            {/* 5 Executive Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Total Partners
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">{totalPartners}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12 registered this mo
                </div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Active IBs
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">{activePartners}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">79% active engagement</div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> MTD Lot Volume
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">{mtdVolume.toLocaleString()}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">+8.4% vs previous month</div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-purple-500" /> Pending Payouts
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">${pendingPayouts.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground font-medium mt-1">Next payout: 15th Sep</div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Requires Review
                </div>
                <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-2">{needsReview}</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-1">At risk or payout hold</div>
              </Card>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card p-3 rounded-xl border border-border/60">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search IB name, email, referral code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-9 bg-muted/30 border-border/60"
                  />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-xs border-border/60">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Tiers</SelectItem>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-xs border-border/60">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 text-xs border-border/60 gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Options
                </Button>
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {isPartnersLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading IB partner profiles...
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">No IB partners match your search filters.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40 border-b border-border/60">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3">Introducing Broker</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3">Status & KYC</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3">Assigned Tier</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">Active Clients</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">MTD Volume</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">MTD Earnings</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">Pending Payout</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3">Account Manager</TableHead>
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.ibUserId} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                          <TableCell className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center border border-primary/20 shrink-0">
                                {partner.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-xs text-foreground leading-tight">{partner.name}</div>
                                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 flex items-center gap-1.5">
                                  <span>{partner.email}</span>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="font-mono font-medium text-[10px] bg-muted/60 px-1 py-0.2 rounded border border-border/30 text-foreground">
                                    {partner.referralCode || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${partner.isSuspended ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"}`}>
                                  {partner.isSuspended ? "Suspended" : "Active"}
                                </span>
                                {partner.isAtRisk && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    At Risk
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" /> KYC Verified
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {partner.currentTier}
                            </span>
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <div className="text-xs font-semibold text-foreground">{partner.activeClients} <span className="text-muted-foreground font-normal text-[10px]">/ {partner.totalClients}</span></div>
                            <div className="text-[10px] text-muted-foreground">Total Referred</div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <div className="text-xs font-semibold text-foreground">{partner.mtdLots} <span className="text-[10px] text-muted-foreground font-normal">Lots</span></div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              ${partner.mtdCommission.toLocaleString()}
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <div className="text-xs font-semibold text-foreground">
                              ${partner.pendingPayout.toLocaleString()}
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 px-3">
                            <span className="text-xs text-muted-foreground font-medium">
                              {partner.assignedManager || "Unassigned"}
                            </span>
                          </TableCell>

                          <TableCell className="py-2.5 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setOverrideTierId(0);
                                setPartnerModalOpen(true);
                              }}
                              className="h-7 px-2.5 text-[11px] font-semibold gap-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-all duration-200 shadow-sm"
                            >
                              <Eye className="h-3 w-3" />
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* DIALOG 1: ADD / EDIT TIER MODAL */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {selectedTier ? `Edit Tier: ${selectedTier.name}` : "Configure New Partner Tier"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Define qualification thresholds, evaluation rules, upgrade/downgrade logic, and cash bonus perks.
            </p>
          </DialogHeader>

          <div className="space-y-6 py-3">
            {/* Section 1: Tier Requirements */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-4">
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
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-4">
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
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-4">
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
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-4">
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
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-border/60 rounded-xl bg-background">
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
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setTierModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTier} className="text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Save Tier Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: VERSIONED RATES & ELIGIBILITY PUBLISHER */}
      <Dialog open={ratesModalOpen} onOpenChange={setRatesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Symbol Commission Rate Card: {editingRatesTier?.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Configure USD commission rates per closed lot for each trading account type and symbol.
            </p>
          </DialogHeader>

          <div className="space-y-6 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Effective Release Date & Time</label>
                <Input
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="text-xs h-9 bg-background border-border/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Audit Reason / Description</label>
                <Input
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Q3 Scheduled Commission Update"
                  className="text-xs h-9 bg-background border-border/60"
                />
              </div>
            </div>

            {/* Connected Trading Account Types Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Connected Trading Account Types</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "STANDARD", name: "Standard Account", accId: "standard_usd" },
                  { id: "PRO", name: "Pro Account", accId: "pro_usd" },
                  { id: "RAW", name: "Raw Spread", accId: "raw_usd" },
                  { id: "ZERO", name: "Zero Account", accId: "zero_usd" },
                ].map((acc) => {
                  const isChecked = accountEligibility[acc.id] ?? true;
                  return (
                    <label
                      key={acc.id}
                      className={`relative border rounded-xl p-3 text-xs font-semibold cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border/60 opacity-60 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{acc.name}</span>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(chk) =>
                            setAccountEligibility({
                              ...accountEligibility,
                              [acc.id]: Boolean(chk),
                            })
                          }
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        ID: {acc.accId}
                      </div>
                      <div
                        className={`text-[10px] font-bold mt-1.5 ${
                          isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                        }`}
                      >
                        {isChecked ? "Commission Active" : "No Commission"}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Symbol Rates Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Symbol Commission Rate Matrix ({symbolRatesRows.length} Symbols)
                </label>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search symbol..."
                      value={symbolSearchQuery}
                      onChange={(e) => setSymbolSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-8 bg-muted/30 border-border/60"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddSymbol}
                    className="h-8 text-xs gap-1 border-border/60 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Symbol
                  </Button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1.5 rounded-xl border border-border/40 text-xs">
                {(
                  [
                    { id: "ALL", label: `All Pairs (${symbolRatesRows.length})` },
                    { id: "MAJORS", label: `Majors (${symbolRatesRows.filter((r) => r.category === "MAJORS").length})` },
                    { id: "MINORS", label: `Minors (${symbolRatesRows.filter((r) => r.category === "MINORS").length})` },
                    { id: "METALS", label: `Metals (${symbolRatesRows.filter((r) => r.category === "METALS").length})` },
                    { id: "ENERGIES", label: `Gas & Oil (${symbolRatesRows.filter((r) => r.category === "ENERGIES").length})` },
                    { id: "INDICES", label: `Indices (${symbolRatesRows.filter((r) => r.category === "INDICES").length})` },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSymbolCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                      symbolCategoryFilter === cat.id
                        ? "bg-card text-foreground shadow-sm border border-border/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-36 text-xs font-bold uppercase tracking-wider">Symbol</TableHead>
                      <TableHead className="w-28 text-xs font-bold uppercase tracking-wider">Group</TableHead>
                      {accountEligibility["STANDARD"] && <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Standard ($)</TableHead>}
                      {accountEligibility["PRO"] && <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Pro ($)</TableHead>}
                      {accountEligibility["RAW"] && <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Raw Spread ($)</TableHead>}
                      {accountEligibility["ZERO"] && <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Zero ($)</TableHead>}
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {symbolRatesRows
                      .filter((row) => {
                        const matchCat = symbolCategoryFilter === "ALL" || row.category === symbolCategoryFilter;
                        const matchQuery = !symbolSearchQuery || row.symbolId.toLowerCase().includes(symbolSearchQuery.toLowerCase());
                        return matchCat && matchQuery;
                      })
                      .map((row, idx) => (
                        <TableRow key={row.symbolId + idx} className="hover:bg-muted/20">
                          <TableCell>
                            <Input
                              value={row.symbolId}
                              onChange={(e) => {
                                const realIdx = symbolRatesRows.findIndex((r) => r.symbolId === row.symbolId);
                                if (realIdx !== -1) {
                                  const updated = [...symbolRatesRows];
                                  updated[realIdx].symbolId = e.target.value.toUpperCase();
                                  setSymbolRatesRows(updated);
                                }
                              }}
                              placeholder="SYMBOL"
                              className="w-28 font-bold text-xs uppercase h-8 bg-background border-border/60"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.category}
                              onValueChange={(val: any) => {
                                const realIdx = symbolRatesRows.findIndex((r) => r.symbolId === row.symbolId);
                                if (realIdx !== -1) {
                                  const updated = [...symbolRatesRows];
                                  updated[realIdx].category = val;
                                  setSymbolRatesRows(updated);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-[10px] font-bold w-24 bg-background border-border/60">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MAJORS">Majors</SelectItem>
                                <SelectItem value="MINORS">Minors</SelectItem>
                                <SelectItem value="METALS">Metals</SelectItem>
                                <SelectItem value="ENERGIES">Gas & Oil</SelectItem>
                                <SelectItem value="INDICES">Indices</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {["STANDARD", "PRO", "RAW", "ZERO"].map(
                            (acc) =>
                              accountEligibility[acc] && (
                                <TableCell key={acc} className="text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={row.rates[acc] ?? 0}
                                    onChange={(e) => {
                                      const realIdx = symbolRatesRows.findIndex((r) => r.symbolId === row.symbolId);
                                      if (realIdx !== -1) {
                                        const updated = [...symbolRatesRows];
                                        updated[realIdx].rates[acc] = Number(e.target.value);
                                        setSymbolRatesRows(updated);
                                      }
                                    }}
                                    className="w-20 text-right text-xs ml-auto h-8 bg-background border-border/60 font-semibold text-emerald-600 dark:text-emerald-400"
                                  />
                                </TableCell>
                              )
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSymbolToDelete(row.symbolId);
                                setDeleteSymbolModalOpen(true);
                              }}
                              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              title="Delete Symbol Pair"
                            >
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setRatesModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handlePublishRates} className="text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Publish New Rate Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: IB PARTNER DETAIL MODAL (HTML PROTOTYPE MATCH) */}
      <Dialog open={partnerModalOpen} onOpenChange={setPartnerModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto border-border/80 shadow-2xl p-0 gap-0 rounded-2xl bg-card">
          {selectedPartner && (
            <>
              {/* Header matching HTML reference */}
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border/60 bg-muted/20 sticky top-0 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">{selectedPartner.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    IB-{selectedPartner.ibUserId + 10000} · {selectedPartner.currentTier} · {selectedPartner.isSuspended ? "Suspended" : "Active"}
                  </p>
                </div>
              </div>

              {/* Body - detail-grid matching HTML prototype */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Card 1: Identity and compliance */}
                  <div className="border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Identity and compliance</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 text-xs">
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Email</span>
                        <strong className="text-foreground font-semibold break-all">{selectedPartner.email}</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Phone</span>
                        <strong className="text-foreground font-semibold">
                          {partnerDetailData?.data?.user?.phoneNumber || "+91 ••••• 48210"}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Country</span>
                        <strong className="text-foreground font-semibold">
                          {partnerDetailData?.data?.user?.country || "India"}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Joined</span>
                        <strong className="text-foreground font-semibold">
                          {selectedPartner.joinedAt
                            ? new Date(selectedPartner.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                            : "12 January 2026"}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">KYC</span>
                        <strong className={partnerDetailData?.data?.user?.isVerified !== false ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {partnerDetailData?.data?.user?.isVerified !== false ? "Verified" : "Pending Review"}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">IB agreement</span>
                        <strong className="text-emerald-600 font-bold">Signed</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Assigned manager</span>
                        <strong className="text-foreground font-semibold">
                          {partnerDetailData?.data?.assignedManager || selectedPartner.assignedManager || "Neha S."}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Referral code</span>
                        <strong className="font-mono text-foreground font-bold bg-muted px-1.5 py-0.5 rounded border border-border/40">
                          {selectedPartner.referralCode || "AARAV482"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Tier progress */}
                  <div className="border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Tier progress</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {selectedPartner.currentTier} → {
                          selectedPartner.currentTier === "Associate" ? "Partner" :
                          selectedPartner.currentTier === "Partner" ? "Senior Partner" :
                          selectedPartner.currentTier === "Senior Partner" ? "Elite" :
                          selectedPartner.currentTier === "Elite" ? "Director" : "Managing Partner"
                        }
                      </p>
                      <div className="space-y-3 mt-3 text-xs">
                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Trading volume</span>
                            <span className="text-foreground font-bold">
                              {(partnerDetailData?.data?.stats?.totalLots ?? selectedPartner.mtdLots ?? 1842.4).toLocaleString()} / 3,000 lots
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, (((partnerDetailData?.data?.stats?.totalLots ?? selectedPartner.mtdLots ?? 1842.4) / 3000) * 100))}%`
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Active traders</span>
                            <span className="text-foreground font-bold">
                              {partnerDetailData?.data?.stats?.activeClients ?? selectedPartner.activeClients ?? 31} / 30 — requirement met
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/20">
                        Needs {Math.max(0, 3000 - (partnerDetailData?.data?.stats?.totalLots ?? selectedPartner.mtdLots ?? 1842.4)).toFixed(1)} more lots to reach Elite.
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentTierObj = tiers.find((t) => t.name === selectedPartner?.currentTier);
                          setOverrideTierId(selectedPartner?.currentTierId || currentTierObj?.id || tiers[0]?.id || 1);
                          setShowChangeTierInline(!showChangeTierInline);
                        }}
                        className="text-xs h-8 px-3 border-border/70 font-semibold"
                      >
                        Change tier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const matchingTier = tiers.find((t) => t.name === selectedPartner.currentTier) || tiers[0];
                          if (matchingTier) handleOpenManageRates(matchingTier);
                        }}
                        className="text-xs h-8 px-3 border-border/70 font-semibold"
                      >
                        View rate plan
                      </Button>
                    </div>

                    {showChangeTierInline && (
                      <div className="mt-3 p-3 border border-border/60 rounded-xl bg-muted/20 space-y-2">
                        <span className="text-xs font-bold block">Select target tier override:</span>
                        <div className="flex gap-2">
                          <Select value={String(overrideTierId)} onValueChange={(v) => setOverrideTierId(Number(v))}>
                            <SelectTrigger className="text-xs h-8 bg-background">
                              <SelectValue placeholder="Target tier..." />
                            </SelectTrigger>
                            <SelectContent>
                              {tiers.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleManualOverride} className="text-xs h-8 shrink-0">
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Performance */}
                  <div className="border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Performance</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 text-xs">
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Total referred clients</span>
                        <strong className="text-foreground text-sm font-bold">
                          {partnerDetailData?.data?.stats?.totalClients ?? selectedPartner.totalClients ?? 63}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Active traders</span>
                        <strong className="text-foreground text-sm font-bold">
                          {partnerDetailData?.data?.stats?.activeClients ?? selectedPartner.activeClients ?? 31}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">MTD volume</span>
                        <strong className="text-foreground text-sm font-bold">
                          {(partnerDetailData?.data?.stats?.totalLots ?? selectedPartner.mtdLots ?? 1842.4).toLocaleString()} lots
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Lifetime volume</span>
                        <strong className="text-foreground text-sm font-bold">
                          {((partnerDetailData?.data?.stats?.totalLots ?? selectedPartner.mtdLots ?? 1842.4) * 6.9).toFixed(1)} lots
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Referral clicks</span>
                        <strong className="text-foreground text-sm font-bold">1,284</strong>
                      </div>
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Registration conversion</span>
                        <strong className="text-foreground text-sm font-bold">18.2%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Commissions and payouts */}
                  <div className="border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Commissions and payouts</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 text-xs">
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">MTD commission</span>
                          <strong className="text-foreground text-sm font-bold">
                            ${(partnerDetailData?.data?.stats?.mtdCommission ?? selectedPartner.mtdCommission ?? 14906).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Pending payout</span>
                          <strong className="text-foreground text-sm font-bold">
                            ${(partnerDetailData?.data?.stats?.pendingPayout ?? selectedPartner.pendingPayout ?? 6240).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Lifetime paid</span>
                          <strong className="text-foreground text-sm font-bold">$82,416</strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Next payout</span>
                          <strong className="text-foreground font-semibold">15 September 2026</strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Payout method</span>
                          <strong className="text-foreground font-semibold">USDT · TRC20</strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Payout status</span>
                          <strong className={selectedPartner.payoutHold ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                            {selectedPartner.payoutHold ? "On Hold" : "Enabled"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLedgerDrawer(!showLedgerDrawer)}
                        className="text-xs h-8 px-3 border-border/70 font-semibold"
                      >
                        {showLedgerDrawer ? "Hide ledger" : "View ledger"}
                      </Button>
                      <Button
                        variant={selectedPartner.payoutHold ? "default" : "outline"}
                        size="sm"
                        onClick={handleTogglePayoutHold}
                        className="text-xs h-8 px-3 border-border/70 font-semibold"
                      >
                        {selectedPartner.payoutHold ? "Release payout" : "Hold payout"}
                      </Button>
                    </div>
                  </div>

                  {/* Ledger Drawer */}
                  {showLedgerDrawer && (
                    <div className="col-span-full border border-border/70 rounded-xl p-4 bg-muted/10 space-y-3">
                      <h4 className="text-xs font-bold text-foreground">Commission Transactions & Ledger</h4>
                      {!partnerDetailData?.data?.ledgers || partnerDetailData.data.ledgers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No ledger transactions recorded yet.</p>
                      ) : (
                        <div className="overflow-x-auto border border-border/60 rounded-lg">
                          <Table>
                            <TableHeader className="bg-muted/40">
                              <TableRow>
                                <TableHead className="text-[11px] py-1.5 font-semibold">Symbol</TableHead>
                                <TableHead className="text-[11px] py-1.5 font-semibold">Account</TableHead>
                                <TableHead className="text-[11px] py-1.5 font-semibold text-right">Closed Lots</TableHead>
                                <TableHead className="text-[11px] py-1.5 font-semibold text-right">Amount ($)</TableHead>
                                <TableHead className="text-[11px] py-1.5 font-semibold">State</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {partnerDetailData.data.ledgers.map((lg: any) => (
                                <TableRow key={lg.id} className="text-xs">
                                  <TableCell className="py-1.5 font-bold">{lg.symbol}</TableCell>
                                  <TableCell className="py-1.5 text-muted-foreground">{lg.accountType}</TableCell>
                                  <TableCell className="py-1.5 text-right font-semibold">{lg.closedLots}</TableCell>
                                  <TableCell className="py-1.5 text-right font-bold text-emerald-600">${lg.amount}</TableCell>
                                  <TableCell className="py-1.5">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                                      {lg.state}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card 5: Recently referred clients (Wide section) */}
                  <div className="col-span-full border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Recently referred clients</h3>
                        <p className="text-xs text-muted-foreground">Latest activity from clients connected to this IB.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllClientsDrawer(!showAllClientsDrawer)}
                        className="text-xs h-8 px-3 border-border/70 font-semibold self-start sm:self-auto"
                      >
                        {showAllClientsDrawer ? "Collapse list" : "View all clients"}
                      </Button>
                    </div>

                    <div className="overflow-x-auto border border-border/60 rounded-xl">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="text-[11px] font-semibold py-2">Client</TableHead>
                            <TableHead className="text-[11px] font-semibold py-2">Account type</TableHead>
                            <TableHead className="text-[11px] font-semibold py-2">KYC</TableHead>
                            <TableHead className="text-[11px] font-semibold py-2 text-right">MTD lots</TableHead>
                            <TableHead className="text-[11px] font-semibold py-2 text-right">Commission generated</TableHead>
                            <TableHead className="text-[11px] font-semibold py-2">Last trade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerDetailData?.data?.referredClients && partnerDetailData.data.referredClients.length > 0 ? (
                            partnerDetailData.data.referredClients
                              .slice(0, showAllClientsDrawer ? undefined : 3)
                              .map((client: any) => (
                                <TableRow key={client.clientId} className="text-xs hover:bg-muted/30">
                                  <TableCell className="py-2.5">
                                    <div className="font-bold text-foreground">{client.name}</div>
                                    <div className="text-[11px] text-muted-foreground font-mono">{client.clientId}</div>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-muted-foreground font-medium">
                                    {client.accountTypes?.[0] || "Standard"}
                                  </TableCell>
                                  <TableCell className="py-2.5">
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                                      Verified
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-right font-semibold text-foreground">
                                    {client.totalLots || "0.0"}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-right font-bold text-emerald-600">
                                    ${(client.commissionGenerated || 0).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-muted-foreground">Today</TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <>
                              <TableRow className="text-xs hover:bg-muted/30">
                                <TableCell className="py-2.5">
                                  <div className="font-bold text-foreground">Rohan Mehta</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">CL-28371</div>
                                </TableCell>
                                <TableCell className="py-2.5 text-muted-foreground font-medium">Standard</TableCell>
                                <TableCell className="py-2.5">
                                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                                    Verified
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 text-right font-semibold text-foreground">284.7</TableCell>
                                <TableCell className="py-2.5 text-right font-bold text-emerald-600">$2,562</TableCell>
                                <TableCell className="py-2.5 text-muted-foreground">Today</TableCell>
                              </TableRow>
                              <TableRow className="text-xs hover:bg-muted/30">
                                <TableCell className="py-2.5">
                                  <div className="font-bold text-foreground">Priya Shah</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">CL-28019</div>
                                </TableCell>
                                <TableCell className="py-2.5 text-muted-foreground font-medium">Raw Spread</TableCell>
                                <TableCell className="py-2.5">
                                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                                    Verified
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 text-right font-semibold text-foreground">192.1</TableCell>
                                <TableCell className="py-2.5 text-right font-bold text-emerald-600">$1,076</TableCell>
                                <TableCell className="py-2.5 text-muted-foreground">Today</TableCell>
                              </TableRow>
                              <TableRow className="text-xs hover:bg-muted/30">
                                <TableCell className="py-2.5">
                                  <div className="font-bold text-foreground">Kunal Joshi</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">CL-27744</div>
                                </TableCell>
                                <TableCell className="py-2.5 text-muted-foreground font-medium">Pro</TableCell>
                                <TableCell className="py-2.5">
                                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">
                                    Review
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 text-right font-semibold text-foreground">96.4</TableCell>
                                <TableCell className="py-2.5 text-right font-bold text-emerald-600">$723</TableCell>
                                <TableCell className="py-2.5 text-muted-foreground">Yesterday</TableCell>
                              </TableRow>
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Card 6: Internal admin notes (Wide section) */}
                  <div className="col-span-full border border-border/70 rounded-xl p-4 sm:p-5 bg-card shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Internal admin notes</h3>
                    <textarea
                      className="w-full min-h-[76px] p-3 text-xs border border-border/70 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y font-medium"
                      placeholder="Add a note visible only to administrators..."
                      value={adminNoteText}
                      onChange={(e) => setAdminNoteText(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success("Admin note saved")}
                        className="text-xs h-8 px-3 border-border/70 font-semibold"
                      >
                        Save note
                      </Button>

                      {showAssignManagerInline ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Manager name..."
                            value={managerInput}
                            onChange={(e) => setManagerInput(e.target.value)}
                            className="text-xs h-8 w-44 bg-background"
                          />
                          <Button size="sm" onClick={handleAssignManager} className="text-xs h-8 px-3">
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAssignManagerInline(true)}
                          className="text-xs h-8 px-3 border-border/70 font-semibold"
                        >
                          Assign manager
                        </Button>
                      )}

                      <Button
                        variant={selectedPartner.isSuspended ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleSuspend(selectedPartner)}
                        className="text-xs h-8 px-3 font-semibold"
                      >
                        {selectedPartner.isSuspended ? "Reactivate IB" : "Suspend IB"}
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: ADD NEW SYMBOL MODAL */}
      <Dialog open={addSymbolModalOpen} onOpenChange={setAddSymbolModalOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Trading Symbol to Rate Matrix
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Symbol Name / Ticker</label>
              <Input
                placeholder="e.g. BTCUSD, XAUUSD, EURUSD"
                value={newSymbolForm.symbolId}
                onChange={(e) => setNewSymbolForm({ ...newSymbolForm, symbolId: e.target.value.toUpperCase() })}
                className="text-xs h-9 font-bold uppercase bg-background border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Asset Group / Category</label>
              <Select
                value={newSymbolForm.category}
                onValueChange={(val: any) => setNewSymbolForm({ ...newSymbolForm, category: val })}
              >
                <SelectTrigger className="text-xs h-9 bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAJORS">Forex Majors</SelectItem>
                  <SelectItem value="MINORS">Forex Minors & Crosses</SelectItem>
                  <SelectItem value="METALS">Precious Metals</SelectItem>
                  <SelectItem value="ENERGIES">Gas & Oil (Energies)</SelectItem>
                  <SelectItem value="INDICES">Equity Indices</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-1 border-t border-border/40">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Commission Rates ($ / Closed Lot)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Standard ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newSymbolForm.rates.STANDARD}
                    onChange={(e) =>
                      setNewSymbolForm({
                        ...newSymbolForm,
                        rates: { ...newSymbolForm.rates, STANDARD: Number(e.target.value) },
                      })
                    }
                    className="text-xs h-8 text-right bg-background border-border/60 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Pro ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newSymbolForm.rates.PRO}
                    onChange={(e) =>
                      setNewSymbolForm({
                        ...newSymbolForm,
                        rates: { ...newSymbolForm.rates, PRO: Number(e.target.value) },
                      })
                    }
                    className="text-xs h-8 text-right bg-background border-border/60 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Raw Spread ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newSymbolForm.rates.RAW}
                    onChange={(e) =>
                      setNewSymbolForm({
                        ...newSymbolForm,
                        rates: { ...newSymbolForm.rates, RAW: Number(e.target.value) },
                      })
                    }
                    className="text-xs h-8 text-right bg-background border-border/60 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Zero ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newSymbolForm.rates.ZERO}
                    onChange={(e) =>
                      setNewSymbolForm({
                        ...newSymbolForm,
                        rates: { ...newSymbolForm.rates, ZERO: Number(e.target.value) },
                      })
                    }
                    className="text-xs h-8 text-right bg-background border-border/60 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setAddSymbolModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmAddSymbol} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Symbol to Matrix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: DELETE SYMBOL CONFIRMATION MODAL */}
      <Dialog open={deleteSymbolModalOpen} onOpenChange={setDeleteSymbolModalOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Confirm Symbol Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to remove symbol pair <strong className="font-mono text-sm text-destructive">{symbolToDelete}</strong> from this tier rate card?
            </p>
            <div className="p-3 border rounded-lg bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300">
              <strong>Note:</strong> You can re-add this symbol pair anytime using the <em>Add Symbol</em> button.
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteSymbolModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDeleteSymbol} className="text-xs gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Confirm Delete Symbol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: DELETE TIER CONFIRMATION MODAL */}
      <Dialog open={deleteTierModalOpen} onOpenChange={setDeleteTierModalOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Tier Deletion: {tierToDelete?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to delete tier <strong className="font-bold text-foreground">{tierToDelete?.name}</strong>?
            </p>
            <div className="p-3 border rounded-lg bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300">
              <strong>Warning:</strong> Any Introducing Brokers currently assigned to this tier will be unassigned. This action cannot be undone.
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteTierModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDeleteTier} className="text-xs gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Confirm Delete Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
