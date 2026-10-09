import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetTiersQuery,
  useGetTierRatesQuery,
  usePublishTierRatesMutation,
  IbAccountTypeOption,
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
  ArrowLeft,
  Settings,
  ShieldAlert,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Zap,
  CalendarClock,
  Layers,
  Table2,
  Download,
  Upload,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  downloadRatesExcel,
  parseRatesExcel,
  type ParsedRates,
  type RateRow,
  type SymbolCategory,
} from "@/lib/ibRatesExcel";

const FX_MAJORS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "USDCAD", "AUDUSD", "NZDUSD"];

/** Grouping for the rate matrix filter tabs only; it is not sent to the backend. */
const getSymbolCategory = (sym: string): SymbolCategory => {
  const s = sym.toUpperCase().replace(/[\s/._-]/g, "");
  if (FX_MAJORS.includes(s)) return "MAJORS";
  if (/^(BTC|ETH|LTC|XRP|SOL|DOGE|ADA|BNB)/.test(s)) return "CRYPTO";
  if (/^(XAU|XAG|XPT|XPD)/.test(s)) return "METALS";
  if (/(OIL|WTI|BRENT|XNG|NGAS)/.test(s)) return "ENERGIES";
  if (/^(US\d|US500|NAS|SPX|GER|UK\d|JP\d|HK\d|AUS\d|FRA|EU\d)/.test(s)) return "INDICES";
  return "MINORS";
};

// The matrix is always in symbol order. The backend returns rates in no fixed
// order, so an updated rate would otherwise jump to the end of the table.
const bySymbol = (rows: RateRow[]) => [...rows].sort((a, b) => a.symbolId.localeCompare(b.symbolId));

// One tier's commission rate card: which account types earn commission, and the
// USD rate per closed lot for each symbol on each of them. Opened from a tier's
// "Rates" button on IB management, and from a partner's "View rate plan".
export default function IbTierRates() {
  const navigate = useNavigate();
  const { tierId: tierIdParam } = useParams();
  const tierId = Number(tierIdParam);
  const backToTiers = () => navigate("/ib-management?tab=tiers");

  const { data: tiersData, isLoading: isTiersLoading } = useGetTiersQuery();
  const tier = tiersData?.data?.find((t) => t.id === tierId);

  const [publishTierRates, { isLoading: isPublishing }] = usePublishTierRatesMutation();

  const [changeReason, setChangeReason] = useState("Scheduled tier rate update");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
  // Keyed by account type id (Account Types Management)
  const [accountEligibility, setAccountEligibility] = useState<{ [key: string]: boolean }>({});

  // currentData: only this tier's rates, never another tier's. Usually served
  // from the cache IB management prefetched.
  const { currentData: tierRatesData } = useGetTierRatesQuery(tierId, {
    skip: !Number.isInteger(tierId) || tierId <= 0,
  });
  const isTierRatesFetching = !tierRatesData;

  const brokerAccountTypes: IbAccountTypeOption[] = tierRatesData?.data?.accountTypes || [];
  const eligibleAccountTypes = brokerAccountTypes.filter((acc) => accountEligibility[acc.id] ?? true);

  const [symbolCategoryFilter, setSymbolCategoryFilter] = useState<"ALL" | SymbolCategory>("ALL");
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [symbolRatesRows, setSymbolRatesRows] = useState<RateRow[]>([]);

  // Build the matrix from the tier's published rates; a tier that has never been
  // published starts from the broker's symbols with zero rates.
  useEffect(() => {
    if (!tierRatesData?.data) return;
    const { accountTypes = [], symbols = [], activeVersion } = tierRatesData.data;

    const eligMap: Record<string, boolean> = {};
    accountTypes.forEach((a) => {
      eligMap[a.id] = a.isEligible;
    });
    setAccountEligibility(eligMap);

    const zeroRates = () => Object.fromEntries(accountTypes.map((a) => [a.id, 0])) as Record<string, number>;
    const symbolMap: Record<string, Record<string, number>> = {};

    if (Array.isArray(activeVersion?.symbolRates) && activeVersion.symbolRates.length > 0) {
      activeVersion.symbolRates.forEach((sr: any) => {
        const sym = String(sr.symbolId).toUpperCase();
        if (!symbolMap[sym]) symbolMap[sym] = zeroRates();
        symbolMap[sym][String(sr.accountTypeId)] = Number(sr.ratePerClosedLot);
      });
    } else {
      symbols.forEach((sym) => {
        symbolMap[sym.toUpperCase()] = zeroRates();
      });
    }

    setSymbolRatesRows(
      bySymbol(
        Object.entries(symbolMap).map(([symId, rates]) => ({
          symbolId: symId,
          category: getSymbolCategory(symId),
          rates,
        }))
      )
    );
  }, [tierRatesData]);

  // Add Symbol dialog
  const [addSymbolModalOpen, setAddSymbolModalOpen] = useState(false);
  const [newSymbolForm, setNewSymbolForm] = useState<RateRow>({
    symbolId: "",
    category: "MAJORS",
    rates: {},
  });

  // Delete Symbol confirmation
  const [deleteSymbolModalOpen, setDeleteSymbolModalOpen] = useState(false);
  const [symbolToDelete, setSymbolToDelete] = useState<string | null>(null);

  const handleOpenAddSymbol = () => {
    setNewSymbolForm({
      symbolId: "",
      category: "MAJORS",
      rates: Object.fromEntries(brokerAccountTypes.map((a) => [a.id, 0])),
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
    setSymbolRatesRows(
      bySymbol([
        ...symbolRatesRows,
        {
          symbolId: cleanId,
          category: newSymbolForm.category,
          rates: { ...newSymbolForm.rates },
        },
      ])
    );
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

  // rows: the matrix on screen, or the one read from an uploaded Excel file.
  const publishRates = async (rows: RateRow[]) => {
    if (!tier) return false;
    try {
      if (brokerAccountTypes.length === 0) {
        toast.error("No account types found. Create account types in Account Types Management first.");
        return false;
      }

      const accountTypes = brokerAccountTypes.map((acc) => ({
        accountTypeId: acc.id,
        isEligible: accountEligibility[acc.id] ?? true,
      }));

      // Only eligible account types carry rates
      const symbolRates = rows.map((row) => ({
        symbolId: row.symbolId,
        accountRates: Object.fromEntries(
          eligibleAccountTypes.map((acc) => [acc.id, Number(row.rates[acc.id] ?? 0)])
        ),
      }));

      await publishTierRates({
        tierId: tier.id,
        body: {
          effectiveFrom,
          changeReason,
          accountTypes,
          symbolRates,
        },
      }).unwrap();

      toast.success("Commission rate card published successfully");
      return true;
    } catch (err: any) {
      toast.error(err?.data?.message || "Unable to publish rates. Please try again.");
      return false;
    }
  };

  // Stays on the page: the published card reloads into the matrix. The next
  // publish starts from now, after the version just published.
  const handlePublishRates = async () => {
    if (await publishRates(symbolRatesRows)) setEffectiveFrom(new Date().toISOString().slice(0, 16));
  };

  // Excel: download the matrix, edit it, upload it back to publish.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploaded, setUploaded] = useState<(ParsedRates & { fileName: string }) | null>(null);
  const excelAccountTypes = eligibleAccountTypes.map((a) => ({ id: String(a.id), name: a.name }));

  const handleDownloadExcel = async () => {
    try {
      const safeName = (tier?.name ?? "tier").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const date = new Date().toISOString().slice(0, 10);
      await downloadRatesExcel(symbolRatesRows, excelAccountTypes, `ib-rates-${safeName}-${date}.xlsx`);
    } catch {
      toast.error("Unable to create the Excel file. Please try again.");
    }
  };

  const handleExcelSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsReadingFile(true);
    try {
      const parsed = await parseRatesExcel(file, excelAccountTypes, symbolRatesRows, getSymbolCategory);
      setUploaded({ ...parsed, fileName: file.name });
    } catch {
      toast.error("Unable to read this file. Upload an .xlsx file.");
    } finally {
      setIsReadingFile(false);
    }
  };

  const uploadSummary = (() => {
    if (!uploaded) return null;
    const before = new Map(symbolRatesRows.map((r) => [r.symbolId, r]));
    const inFile = new Set(uploaded.rows.map((r) => r.symbolId));
    let added = 0;
    // Every rate that changed, one per symbol and account type: two rates
    // changed on one symbol are two changes, not one.
    const changes: Array<{ symbolId: string; account: string; from: number; to: number }> = [];
    uploaded.rows.forEach((r) => {
      const old = before.get(r.symbolId);
      if (!old) {
        added += 1;
        return;
      }
      excelAccountTypes.forEach((a) => {
        const from = Number(old.rates[a.id] ?? 0);
        const to = Number(r.rates[a.id] ?? 0);
        if (from !== to) changes.push({ symbolId: r.symbolId, account: a.name, from, to });
      });
    });
    const removed = symbolRatesRows.filter((r) => !inFile.has(r.symbolId)).map((r) => r.symbolId);
    return { added, changes, removed };
  })();

  const handlePublishUploaded = async () => {
    if (!uploaded || uploaded.errors.length > 0) return;
    if (await publishRates(uploaded.rows)) {
      setSymbolRatesRows(bySymbol(uploaded.rows));
      setUploaded(null);
      setEffectiveFrom(new Date().toISOString().slice(0, 16));
    }
  };

  const countIn = (cat: SymbolCategory) => symbolRatesRows.filter((r) => r.category === cat).length;
  const visibleRows = symbolRatesRows.filter((row) => {
    const matchCat = symbolCategoryFilter === "ALL" || row.category === symbolCategoryFilter;
    const matchQuery = !symbolSearchQuery || row.symbolId.toLowerCase().includes(symbolSearchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  if (!isTiersLoading && !tier) {
    return (
      <DashboardLayout title="IB Rate Card">
        <div className="max-w-7xl mx-auto">
          <Card className="border-border/80">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">This partner tier was not found. It may have been deleted.</p>
              <Button variant="outline" size="sm" onClick={backToTiers} className="text-xs">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to IB tiers
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={tier ? `Rate Card: ${tier.name}` : "IB Rate Card"}>
      <div className="space-y-6 max-w-7xl mx-auto pb-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shrink-0">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Symbol Commission Rate Card</h1>
                {tier && (
                  <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary bg-primary/10">
                    {tier.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure USD commission rates per closed lot for each trading account type and symbol.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={backToTiers} className="h-9 text-xs">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> IB tiers
            </Button>
            <Button
              size="sm"
              onClick={handlePublishRates}
              disabled={!tier || isTierRatesFetching || isPublishing}
              className="h-9 text-xs gap-1.5"
            >
              {isPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Publish New Rate Card
            </Button>
          </div>
        </div>

        {/* Release details */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Release Details
            </CardTitle>
            <CardDescription className="text-xs">
              When this rate card takes effect, and why it changed. The reason is kept in the version history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="rates-effective-from" className="text-xs font-bold text-foreground">
                  Effective Release Date & Time
                </label>
                <Input
                  id="rates-effective-from"
                  type="datetime-local"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="text-sm h-10 bg-background border-border/60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="rates-change-reason" className="text-xs font-bold text-foreground">
                  Audit Reason / Description
                </label>
                <Input
                  id="rates-change-reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Q3 Scheduled Commission Update"
                  className="text-sm h-10 bg-background border-border/60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected trading account types */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Connected Trading Account Types
            </CardTitle>
            <CardDescription className="text-xs">
              Trades on a ticked account type earn this tier's commission. Unticked types earn none and are left out of the matrix.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTierRatesFetching ? (
              <div className="py-4 text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" /> Loading account types...
              </div>
            ) : brokerAccountTypes.length === 0 ? (
              <div className="border border-dashed border-border/60 rounded-xl p-4 text-xs text-muted-foreground">
                No account types found. Create account types in Account Types Management first.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {brokerAccountTypes.map((acc) => {
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate">{acc.name}</span>
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
                        ID: {acc.id}
                        {!acc.isActive && " · Disabled"}
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
            )}
          </CardContent>
        </Card>

        {/* Symbol rate matrix */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" /> Symbol Commission Rate Matrix
                  <span className="text-xs font-semibold text-muted-foreground">({symbolRatesRows.length} symbols)</span>
                </CardTitle>
                <CardDescription className="text-xs">USD paid to the IB per closed lot.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search symbol..."
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9 bg-muted/30 border-border/60"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddSymbol}
                  disabled={isTierRatesFetching}
                  className="h-9 text-xs gap-1 border-border/60 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Symbol
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExcel}
                  disabled={isTierRatesFetching || eligibleAccountTypes.length === 0}
                  className="h-9 text-xs gap-1 border-border/60 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" /> Download Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTierRatesFetching || isReadingFile || eligibleAccountTypes.length === 0}
                  className="h-9 text-xs gap-1 border-border/60 shrink-0"
                >
                  {isReadingFile ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Excel
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleExcelSelected}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Category filter tabs, with a save button so a long matrix need not be scrolled */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1.5 rounded-xl border border-border/40 text-xs">
              {(["ALL", ...(Object.keys(CATEGORY_LABELS) as SymbolCategory[])] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSymbolCategoryFilter(id)}
                  className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    symbolCategoryFilter === id
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  }`}
                >
                  {id === "ALL"
                    ? `All Pairs (${symbolRatesRows.length})`
                    : `${CATEGORY_LABELS[id]} (${countIn(id)})`}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handlePublishRates}
              disabled={!tier || isTierRatesFetching || isPublishing}
              className="h-9 text-xs gap-1.5 shrink-0"
            >
              {isPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Save Rates
            </Button>
            </div>

            <div className="border border-border/60 rounded-xl overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-36 text-xs font-bold uppercase tracking-wider">Symbol</TableHead>
                    <TableHead className="w-28 text-xs font-bold uppercase tracking-wider">Group</TableHead>
                    {eligibleAccountTypes.map((acc) => (
                      <TableHead key={acc.id} className="text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        {acc.name} ($)
                      </TableHead>
                    ))}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTierRatesFetching ? (
                    <TableRow>
                      <TableCell colSpan={eligibleAccountTypes.length + 3} className="py-8 text-center text-xs text-muted-foreground">
                        <RefreshCw className="inline h-3.5 w-3.5 mr-2 animate-spin text-primary" /> Loading rate card...
                      </TableCell>
                    </TableRow>
                  ) : visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={eligibleAccountTypes.length + 3} className="py-8 text-center text-xs text-muted-foreground">
                        No symbols match. Use Add Symbol to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, idx) => (
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
                              {(Object.keys(CATEGORY_LABELS) as SymbolCategory[]).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {CATEGORY_LABELS[c]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {eligibleAccountTypes.map((acc) => (
                          <TableCell key={acc.id} className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.rates[acc.id] ?? 0}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setSymbolRatesRows((rows) =>
                                  rows.map((r) =>
                                    r.symbolId === row.symbolId ? { ...r, rates: { ...r.rates, [acc.id]: value } } : r
                                  )
                                );
                              }}
                              className="w-24 text-right text-xs ml-auto h-8 bg-background border-border/60 font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                          </TableCell>
                        ))}
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
                            aria-label={`Delete ${row.symbolId}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions, so a long matrix does not need scrolling back up */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={backToTiers} className="h-9 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handlePublishRates}
            disabled={!tier || isTierRatesFetching || isPublishing}
            className="h-9 text-xs gap-1.5"
          >
            {isPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Publish New Rate Card
          </Button>
        </div>
      </div>

      {/* Add symbol */}
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
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-1 border-t border-border/40">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Commission Rates ($ / Closed Lot)</label>
              {eligibleAccountTypes.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No eligible account types. Add account types in Account Types Management.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {eligibleAccountTypes.map((acc) => (
                    <div key={acc.id} className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">{acc.name} ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newSymbolForm.rates[acc.id] ?? 0}
                        onChange={(e) =>
                          setNewSymbolForm({
                            ...newSymbolForm,
                            rates: { ...newSymbolForm.rates, [acc.id]: Number(e.target.value) },
                          })
                        }
                        className="text-xs h-8 text-right bg-background border-border/60 font-semibold"
                      />
                    </div>
                  ))}
                </div>
              )}
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

      {/* Uploaded Excel: check, then publish */}
      <Dialog open={uploaded !== null} onOpenChange={(open) => !open && !isPublishing && setUploaded(null)}>
        <DialogContent className="max-w-lg border-border/80 shadow-xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Publish Rates from Excel
            </DialogTitle>
          </DialogHeader>

          {uploaded && uploadSummary && (
            <div className="space-y-3 py-2 text-xs">
              <p className="text-muted-foreground">
                File: <span className="font-semibold text-foreground">{uploaded.fileName}</span>
              </p>

              {uploaded.errors.length > 0 ? (
                <div className="p-3 border rounded-lg bg-destructive/10 border-destructive/20 text-destructive space-y-1 max-h-48 overflow-y-auto">
                  <p className="font-bold">Fix these in the file and upload it again. Nothing was published.</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {uploaded.errors.slice(0, 50).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {uploaded.errors.length > 50 && <li>…and {uploaded.errors.length - 50} more.</li>}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Symbols in file", value: uploaded.rows.length },
                      { label: "New", value: uploadSummary.added },
                      { label: "Rates changed", value: uploadSummary.changes.length },
                      { label: "Removed", value: uploadSummary.removed.length },
                    ].map((stat) => (
                      <div key={stat.label} className="border border-border/60 rounded-lg p-2.5">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
                        <div className="text-lg font-bold text-foreground">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  {uploadSummary.changes.length > 0 && (
                    <div className="border border-border/60 rounded-lg max-h-40 overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <tbody>
                          {uploadSummary.changes.map((c) => (
                            <tr key={`${c.symbolId}|${c.account}`} className="border-b border-border/40 last:border-0">
                              <td className="px-2.5 py-1.5 font-mono font-semibold text-foreground">{c.symbolId}</td>
                              <td className="px-2.5 py-1.5 text-muted-foreground">{c.account}</td>
                              <td className="px-2.5 py-1.5 text-right tabular-nums">
                                {c.from} → <span className="font-semibold text-emerald-600 dark:text-emerald-400">{c.to}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {uploadSummary.removed.length > 0 && (
                    <div className="p-3 border rounded-lg bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300">
                      Not in the file, so they will be removed from this rate card:{" "}
                      <span className="font-mono font-semibold">{uploadSummary.removed.join(", ")}</span>
                    </div>
                  )}
                  <p className="text-muted-foreground">
                    Updates this tier's current rates (a future effective date under Release Details schedules them
                    instead). Reason: <span className="font-semibold text-foreground">"{changeReason}"</span>.
                  </p>
                </>
              )}

              {uploaded.warnings.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {uploaded.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => setUploaded(null)} disabled={isPublishing} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePublishUploaded}
              disabled={!uploaded || uploaded.errors.length > 0 || isPublishing}
              className="text-xs gap-1.5"
            >
              {isPublishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Publish to Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete symbol confirmation */}
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
    </DashboardLayout>
  );
}
