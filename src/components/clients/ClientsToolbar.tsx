import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CLIENT_PRESETS,
  CLIENT_SORT_LABEL,
  DEFAULT_CLIENT_FILTERS,
  type ClientFilters,
  type ClientSort,
} from "@/features/users/clientList";

interface ClientsToolbarProps {
  filters: ClientFilters;
  onChange: (next: ClientFilters) => void;
  /** Account type names present in the data. */
  accountTypes: string[];
}

const REGISTERED_LABEL: Record<ClientFilters["registered"], string> = {
  all: "Any time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This year",
};

export function ClientsToolbar({ filters, onChange, accountTypes }: ClientsToolbarProps) {
  const set = <K extends keyof ClientFilters>(k: K, v: ClientFilters[K]) => onChange({ ...filters, [k]: v });

  const isPresetActive = (apply: Partial<ClientFilters>) =>
    (Object.keys(apply) as (keyof ClientFilters)[]).every((k) => filters[k] === apply[k]);

  // What is narrowing the list, as removable chips.
  const active: { key: keyof ClientFilters; label: string }[] = [];
  if (filters.kyc !== "all") active.push({ key: "kyc", label: `KYC: ${filters.kyc}` });
  if (filters.registered !== "all") active.push({ key: "registered", label: `Joined: ${REGISTERED_LABEL[filters.registered]}` });
  if (filters.accountType !== "all")
    active.push({ key: "accountType", label: filters.accountType === "none" ? "No trading account" : `Type: ${filters.accountType}` });
  if (filters.funded !== "all") active.push({ key: "funded", label: filters.funded === "funded" ? "Funded" : "Never deposited" });
  if (filters.status !== "all") active.push({ key: "status", label: filters.status === "active" ? "Active" : "Disabled" });

  const anyChanged = active.length > 0 || filters.search !== "" || filters.sort !== DEFAULT_CLIENT_FILTERS.sort;

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick views
        </span>
        {CLIENT_PRESETS.map((p) => {
          const on = isPresetActive(p.apply);
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? DEFAULT_CLIENT_FILTERS : { ...DEFAULT_CLIENT_FILTERS, search: filters.search, ...p.apply })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <div className="relative xl:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, email, phone or ID"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground xl:block" />

          <Select value={filters.kyc} onValueChange={(v) => set("kyc", v as ClientFilters["kyc"])}>
            <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC</SelectItem>
              <SelectItem value="approved">KYC approved</SelectItem>
              <SelectItem value="pending">KYC pending</SelectItem>
              <SelectItem value="rejected">KYC rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.registered} onValueChange={(v) => set("registered", v as ClientFilters["registered"])}>
            <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(REGISTERED_LABEL) as ClientFilters["registered"][]).map((k) => (
                <SelectItem key={k} value={k}>{k === "all" ? "Joined: any time" : REGISTERED_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.accountType} onValueChange={(v) => set("accountType", v)}>
            <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All account types</SelectItem>
              {accountTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
              <SelectItem value="none">No trading account</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.funded} onValueChange={(v) => set("funded", v as ClientFilters["funded"])}>
            <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Funded or not</SelectItem>
              <SelectItem value="funded">Funded</SelectItem>
              <SelectItem value="unfunded">Never deposited</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => set("status", v as ClientFilters["status"])}>
            <SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sort} onValueChange={(v) => set("sort", v as ClientSort)}>
            <SelectTrigger className="h-9 w-[190px] text-sm xl:ml-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CLIENT_SORT_LABEL) as ClientSort[]).map((k) => (
                <SelectItem key={k} value={k}>Sort: {CLIENT_SORT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters */}
      {anyChanged && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {active.map((a) => (
            <span key={a.key} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
              {a.label}
              <button
                type="button"
                aria-label={`Remove ${a.label}`}
                onClick={() => set(a.key, DEFAULT_CLIENT_FILTERS[a.key] as never)}
                className="rounded-full hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => onChange(DEFAULT_CLIENT_FILTERS)}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
