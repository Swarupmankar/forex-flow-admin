import { useState } from "react";
import { Check, Coins, Network, Pencil, Percent, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetSpreadEarnedQuery,
  useSetSpreadEarnedMutation,
} from "@/API/accounting.api";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

interface RevenueOverviewProps {
  /** Sum of brokeragePaid over every order: the commission charged per trade. */
  commissionEarned: number | null;
  /** Completed CoinsBuy payouts from IB commission wallets. */
  ibWithdrawals: number | null;
  isCommissionLoading: boolean;
}

/**
 * What the broker earns from trading: commission and spread in, less what IBs
 * have withdrawn of their commission.
 *
 * Commission is computed: each order records the commission charged on it from
 * its account type's rate. Spread is not -- no order records the spread the
 * client paid -- so the admin types it in, and the card says so.
 */
export function RevenueOverview({
  commissionEarned,
  ibWithdrawals,
  isCommissionLoading,
}: RevenueOverviewProps) {
  const {
    data: spreadData,
    isLoading: isSpreadLoading,
    isError: isSpreadError,
    isFetching: isSpreadFetching,
    refetch: refetchSpread,
  } = useGetSpreadEarnedQuery();
  const [saveSpread, { isLoading: isSaving }] = useSetSpreadEarnedMutation();

  // "add" puts a new period's spread on top of the stored total; "edit"
  // replaces the total, for corrections.
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [draft, setDraft] = useState("");

  const spreadEarned = spreadData?.spreadEarned ?? null;
  const gross =
    commissionEarned !== null && spreadEarned !== null
      ? commissionEarned + spreadEarned
      : null;
  const ibOut = ibWithdrawals ?? 0;
  const total = gross !== null ? gross - ibOut : null;

  const open = (next: "add" | "edit") => {
    setDraft(next === "edit" && spreadEarned !== null ? String(spreadEarned) : "");
    setMode(next);
  };

  const draftValue = Number(draft);
  const isDraftValid = draft.trim() !== "" && Number.isFinite(draftValue) && draftValue >= 0;
  const newTotal =
    mode === "add" ? (spreadEarned ?? 0) + (isDraftValid ? draftValue : 0) : draftValue;

  const onSave = async () => {
    if (!isDraftValid) {
      toast.error("Amount must be zero or more");
      return;
    }
    try {
      await saveSpread(newTotal).unwrap();
      toast.success(mode === "add" ? "Spread added" : "Spread earned updated");
      setMode(null);
    } catch {
      toast.error("Could not update spread earned");
    }
  };

  // Shares of what came in, before IB withdrawals.
  const commissionShare =
    gross && commissionEarned !== null ? (commissionEarned / gross) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1.1fr_2fr]">
          {/* Total */}
          <div className="flex flex-col justify-between gap-6 bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <Sparkles className="h-4 w-4" />
              Broker Revenue
            </div>
            <div>
              <p className="text-sm opacity-80">Commission + Spread − IB withdrawals</p>
              {isCommissionLoading || isSpreadLoading ? (
                <Skeleton className="mt-2 h-10 w-48 bg-primary-foreground/20" />
              ) : (
                <>
                  <p className="mt-1 text-4xl font-bold tracking-tight">
                    {total !== null ? usd(total) : "—"}
                  </p>
                  {gross !== null && (
                    <p className="mt-1 text-xs opacity-80">
                      {usd(gross)} earned − {usd(ibOut)} to IBs
                    </p>
                  )}
                </>
              )}
            </div>
            {gross !== null && gross > 0 && (
              <div className="space-y-2">
                <div className="flex h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                  <div
                    className="h-full bg-primary-foreground"
                    style={{ width: `${commissionShare}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs opacity-90">
                  <span>Commission {commissionShare.toFixed(0)}%</span>
                  <span>Spread {(100 - commissionShare).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Sources */}
          <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-3 bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Percent className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Commission Earned
                  </p>
                </div>
                <Badge variant="secondary">Auto</Badge>
              </div>
              {isCommissionLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {commissionEarned !== null ? usd(commissionEarned) : "—"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Charged on every client order at its account type's commission
                rate.
              </p>
            </div>

            <div className="space-y-3 bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <Coins className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Spread Earned
                  </p>
                </div>
                <Badge variant="outline">Manual</Badge>
              </div>

              {isSpreadLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {spreadEarned !== null ? usd(spreadEarned) : "—"}
                </p>
              )}
              {isSpreadError ? (
                // Add needs the current total to add onto, and the save goes to
                // the same server, so neither action is offered until it loads.
                <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive/5 px-3 py-2">
                  <p className="text-xs text-destructive">
                    Could not load spread earned from the server.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => refetchSpread()}
                    disabled={isSpreadFetching}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not tracked per trade. Enter it from your LP statement.
                </p>
              )}

              {/* Add / edit lives under the value so the figure stays read-only at a glance. */}
              <div className="border-t pt-4">
                {mode ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {mode === "add" ? "Amount to add" : "New total"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          autoFocus
                          placeholder="0.00"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onSave();
                            if (e.key === "Escape") setMode(null);
                          }}
                          className="pl-7"
                          aria-label={mode === "add" ? "Spread amount to add in USD" : "Spread earned total in USD"}
                        />
                      </div>
                      <Button size="icon" onClick={onSave} disabled={isSaving || !isDraftValid} aria-label="Save">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setMode(null)}
                        disabled={isSaving}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {mode === "add" && isDraftValid && (
                      <p className="text-xs text-muted-foreground">
                        New total: <span className="font-semibold text-foreground">{usd(newTotal)}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => open("add")}
                      disabled={isSpreadLoading || spreadEarned === null}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add amount
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => open("edit")}
                      disabled={isSpreadLoading || spreadEarned === null}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit total
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <Network className="h-4 w-4 text-violet-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    IB Withdrawals
                  </p>
                </div>
                <Badge variant="secondary">Auto</Badge>
              </div>
              {isCommissionLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {ibWithdrawals !== null ? `−${usd(ibWithdrawals)}` : "—"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Commission IBs have withdrawn: completed CoinsBuy payouts from their IB wallets.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
