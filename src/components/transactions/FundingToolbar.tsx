import { Bitcoin, Building2, Layers, Network, Search, Smartphone, type LucideIcon } from "lucide-react";
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
  applyFundingFilters,
  type FundingFilters,
  type FundingRow,
  type FundingStatus,
} from "@/features/transactions/funding";

const METHODS: { key: FundingFilters["method"]; label: string; icon: LucideIcon }[] = [
  { key: "all", label: "All", icon: Layers },
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "bank", label: "Bank", icon: Building2 },
  { key: "crypto", label: "Crypto", icon: Bitcoin },
];

const IB_CHIP: (typeof METHODS)[number] = { key: "ib", label: "IB", icon: Network };

interface FundingToolbarProps {
  rows: FundingRow[];
  filters: FundingFilters;
  onChange: (next: FundingFilters) => void;
  /** Offer the deposit / withdrawal filter (history page). */
  showDirection?: boolean;
  /** Statuses the page shows; the status filter is hidden when there is one. */
  statuses?: FundingStatus[];
  /** Add an IB chip after the methods, for IB commission payouts. */
  showIb?: boolean;
}

const STATUS_LABEL: Record<FundingStatus, string> = {
  pending: "Pending",
  approved: "Approved / completed",
  rejected: "Rejected / failed",
};

export function FundingToolbar({
  rows,
  filters,
  onChange,
  showDirection,
  statuses = ["pending", "approved", "rejected"],
  showIb,
}: FundingToolbarProps) {
  const set = <K extends keyof FundingFilters>(k: K, v: FundingFilters[K]) => onChange({ ...filters, [k]: v });

  // What each method chip would show under the other filters.
  const base = applyFundingFilters(rows, filters, { skipMethod: true });
  const count = (m: FundingFilters["method"]) =>
    m === "all" ? base.length : m === "ib" ? base.filter((r) => r.isIb).length : base.filter((r) => r.method === m).length;
  const chips = showIb ? [...METHODS, IB_CHIP] : METHODS;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Methods, then IB when the page asks for it. */}
        {chips.map((m) => {
          const active = filters.method === m.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={active}
              onClick={() => set("method", m.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {count(m.key)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search client, email, ID, reference, coin…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {showDirection && (
            <Select value={filters.direction} onValueChange={(v) => set("direction", v as FundingFilters["direction"])}>
              <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdraw">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          )}
          {statuses.length > 1 && (
            <Select value={filters.status} onValueChange={(v) => set("status", v as FundingFilters["status"])}>
              <SelectTrigger className="h-9 w-[170px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={filters.sort} onValueChange={(v) => set("sort", v as FundingFilters["sort"])}>
            <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="largest">Largest amount</SelectItem>
              <SelectItem value="smallest">Smallest amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
