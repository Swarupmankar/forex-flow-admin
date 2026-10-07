import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bank / UPI money is filed in rupees and held in dollars. The server fixes the
 * INR-per-USD rate when the request is filed and stores it with the rupee
 * amount; `usd` is what the wallet is credited (deposit) or debited (withdraw).
 * Crypto and older rows have no rupee side, so only the dollar figure shows.
 */

export const usdFmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const inrFmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

interface FxProps {
  usd: number;
  inrAmount?: number | null;
  fxRate?: number | null;
  direction: "deposit" | "withdraw";
}

/** One table cell: the dollar amount, with the rupee amount and rate under it. */
export function FxAmountCell({ usd, inrAmount, fxRate }: FxProps) {
  return (
    <div className="whitespace-nowrap">
      <div className="font-semibold text-foreground">{usdFmt(usd)}</div>
      {inrAmount != null && (
        <div className="text-xs text-muted-foreground">
          {inrFmt(inrAmount)}
          {fxRate != null && <> @ ₹{fxRate.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</>}
        </div>
      )}
    </div>
  );
}

/** The full conversion for a detail view, in the order the money moves. */
export function FxBreakdown({
  usd,
  inrAmount,
  fxRate,
  direction,
  pending,
  className,
}: FxProps & { pending?: boolean; className?: string }) {
  if (inrAmount == null) {
    return (
      <div className={cn("rounded-lg border p-4", className)}>
        <p className="text-xs text-muted-foreground">Amount</p>
        <p className="text-2xl font-bold text-foreground">{usdFmt(usd)}</p>
      </div>
    );
  }

  const isDeposit = direction === "deposit";
  const steps = isDeposit
    ? [
        { label: "Client paid", value: inrFmt(inrAmount) },
        { label: "Rate", value: fxRate != null ? `1 USD = ${inrFmt(fxRate)}` : "—" },
        { label: pending ? "Estimated credit" : "Wallet credited", value: usdFmt(usd), strong: true },
      ]
    : [
        { label: "Wallet debited", value: usdFmt(usd) },
        { label: "Rate", value: fxRate != null ? `1 USD = ${inrFmt(fxRate)}` : "—" },
        { label: pending ? "Client receives (est.)" : "Client received", value: inrFmt(inrAmount), strong: true },
      ];

  return (
    <div className={cn("grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg border bg-muted/20 p-4", className)}>
      {steps.map((s, i) => (
        <div key={s.label} className="contents">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={cn("truncate", s.strong ? "text-lg font-bold text-primary" : "text-sm font-semibold text-foreground")}>
              {s.value}
            </p>
          </div>
          {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}
