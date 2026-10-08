import { Network } from "lucide-react";

export type FundingScope = "all" | "ib";

interface FundingScopeTabsProps {
  scope: FundingScope;
  onChange: (scope: FundingScope) => void;
  /** Shown as a badge on each tab; hidden when 0. */
  counts: Record<FundingScope, number>;
  /** Amber for a queue that needs action, neutral for history. */
  tone?: "pending" | "neutral";
}

/** All rows vs. IB commission payouts only. */
export function FundingScopeTabs({ scope, onChange, counts, tone = "neutral" }: FundingScopeTabsProps) {
  const tabs: { key: FundingScope; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ib", label: "IB withdrawals" },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-pressed={scope === t.key}
          onClick={() => onChange(t.key)}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            scope === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.key === "ib" && <Network className="h-4 w-4" />}
          {t.label}
          {counts[t.key] > 0 && (
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
                tone === "pending" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
