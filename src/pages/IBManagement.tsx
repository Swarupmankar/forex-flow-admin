import { useState, useEffect } from "react";
import {
  useGetTiersQuery,
  useGetAllPartnersQuery,
  useDeleteTierMutation,
  IbTier,
  ibAdminApi,
} from "@/API/ibAdmin.api";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { toast } from "sonner";
import {
  Users,
  Layers,
  Edit,
  Trash2,
  Settings,
  Eye,
  ShieldAlert,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  SlidersHorizontal,
  DollarSign,
  BarChart3,
  Sparkles,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

const ACCOUNT_BADGE_STYLES = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
];

export default function IBManagement() {
  const navigate = useNavigate();
  // ?tab=partners comes back from a partner's page, ?tab=tiers from a rate card.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"tiers" | "partners">(
    searchParams.get("tab") === "partners" ? "partners" : "tiers"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // RTK Query Hooks
  const { data: tiersData, isLoading: isTiersLoading, refetch: refetchTiers } = useGetTiersQuery();
  // Every IB, loaded page by page — not just the first page
  const { data: partnersData, isLoading: isPartnersLoading, refetch: refetchPartners } = useGetAllPartnersQuery();

  const [deleteTier] = useDeleteTierMutation();

  // Load every tier's rate card in the background once the tiers are known,
  // so the rate card page opens with its matrix already there
  const prefetchTierRates = ibAdminApi.usePrefetch("getTierRates");
  useEffect(() => {
    (tiersData?.data || []).forEach((t) => prefetchTierRates(t.id));
  }, [tiersData, prefetchTierRates]);

  // Delete Tier Confirmation Modal State
  const [deleteTierModalOpen, setDeleteTierModalOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<IbTier | null>(null);

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

  const handleOpenAddTier = () => {
    if ((tiersData?.data?.length || 0) >= 6) {
      toast.error("Maximum 6 tiers allowed");
      return;
    }
    navigate("/ib-management/tiers/new");
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

  // Summary Metrics: computed by the backend over every IB of the broker
  const summary = partnersData?.data?.summary;
  const totalPartners = summary?.totalPartners ?? rawPartners.length;
  const activePartners = summary?.activePartners ?? rawPartners.filter((p) => !p.isSuspended).length;
  const mtdVolume = summary?.periodVolumeLots ?? rawPartners.reduce((acc, p) => acc + (p.mtdLots || 0), 0);
  const pendingPayouts = summary?.pendingPayouts ?? rawPartners.reduce((acc, p) => acc + (p.pendingPayout || 0), 0);
  const needsReview =
    summary?.needsReview ?? rawPartners.filter((p) => p.isAtRisk || p.payoutHold || p.isSuspended).length;
  // The list holds every IB (loaded page by page), so this counts them all.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newThisMonth = rawPartners.filter((p) => p.joinedAt && new Date(p.joinedAt) >= monthStart).length;

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
                        // Counted by the backend over every IB of the broker, not the loaded page
                        const assignedIbCount = tier.assignedIbCount ?? 0;

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
                                {(tier.accountTypes || []).filter((a) => a.isEligible).length === 0 ? (
                                  <span className="text-[11px] text-muted-foreground">None</span>
                                ) : (
                                  (tier.accountTypes || [])
                                    .filter((a) => a.isEligible)
                                    .map((acc, i) => (
                                      <span
                                        key={acc.id}
                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${ACCOUNT_BADGE_STYLES[i % ACCOUNT_BADGE_STYLES.length]}`}
                                      >
                                        {acc.name}
                                      </span>
                                    ))
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-muted/60 text-foreground border border-border/40">
                                {tier.symbolCount ?? 0} Symbols
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
                                  onClick={() => navigate(`/ib-management/tiers/${tier.id}/rates`)}
                                  className="h-8 px-3 text-xs font-semibold gap-1.5 border border-primary/30 text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-sm"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                  Rates
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/ib-management/tiers/${tier.id}/edit`)}
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
                  <TrendingUp className="h-3 w-3" /> +{newThisMonth} joined this month
                </div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Active IBs
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">{activePartners}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {totalPartners > 0 ? Math.round((activePartners / totalPartners) * 100) : 0}% not suspended
                </div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> MTD Lot Volume
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">{mtdVolume.toLocaleString()}</div>
                <div className="text-[11px] text-blue-600 font-semibold mt-1">Closed lots, current evaluation period</div>
              </Card>

              <Card className="p-4 border-border/60 shadow-sm relative overflow-hidden bg-card hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-purple-500" /> Pending Payouts
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground mt-2">${pendingPayouts.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground font-medium mt-1">Commission not yet paid to IB wallets</div>
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
                        <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-3 text-right">Total Earned</TableHead>
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
                              onClick={() => navigate(`/ib-management/partners/${partner.ibUserId}`)}
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
