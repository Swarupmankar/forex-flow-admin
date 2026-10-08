import { Bitcoin, Building2, CheckCircle2, Clock, Landmark, Smartphone, XCircle, type LucideIcon } from "lucide-react";
import type { FundingRow } from "@/features/transactions/funding";
import { usdFmt } from "./FxAmount";

type Tile = { label: string; value: string; hint: string; icon: LucideIcon; tone: string };

const sum = (list: FundingRow[]) => list.reduce((s, r) => s + r.usd, 0);
const tile = (label: string, list: FundingRow[], icon: LucideIcon, tone: string): Tile => ({
  label,
  value: String(list.length),
  hint: usdFmt(sum(list)),
  icon,
  tone,
});

/**
 * Headline figures over the page's rows, before filters. "pending" is the
 * queue on Deposits / Withdrawals; "history" is what has been settled.
 */
export function FundingStats({ rows, variant }: { rows: FundingRow[]; variant: "pending" | "history" }) {
  const tiles: Tile[] =
    variant === "pending"
      ? [
          tile("Pending", rows, Clock, "bg-amber-100 text-amber-600"),
          tile("UPI", rows.filter((r) => r.method === "upi"), Smartphone, "bg-blue-100 text-blue-600"),
          tile("Bank", rows.filter((r) => r.method === "bank"), Building2, "bg-emerald-100 text-emerald-600"),
          tile("Crypto processing", rows.filter((r) => r.method === "crypto"), Bitcoin, "bg-orange-100 text-orange-600"),
        ]
      : [
          tile("Completed", rows.filter((r) => r.status === "approved"), CheckCircle2, "bg-emerald-100 text-emerald-600"),
          tile("Bank / UPI", rows.filter((r) => r.status === "approved" && r.method !== "crypto"), Landmark, "bg-blue-100 text-blue-600"),
          tile("Crypto", rows.filter((r) => r.status === "approved" && r.method === "crypto"), Bitcoin, "bg-orange-100 text-orange-600"),
          tile("Rejected / failed", rows.filter((r) => r.status === "rejected"), XCircle, "bg-red-100 text-red-600"),
        ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <div className={`rounded-lg p-2 ${t.tone}`}><t.icon className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">{t.value}</p>
            <p className="truncate text-[11px] text-muted-foreground">{t.label} · {t.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
