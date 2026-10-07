import React, { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  Scale,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useGetCryptoProfitQuery,
  useGetCryptoWithdrawFeeQuery,
  useSetCryptoWithdrawFeeMutation,
  useGetIbMinWithdrawQuery,
  useSetIbMinWithdrawMutation,
} from "@/API/cryptoRails.api";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * The CoinsBuy rails, read as a pair.
 *
 * Deposits only ever cost: a user who sends 100 is credited 100 while the
 * merchant wallet receives 100 minus CoinsBuy's commission. The flat withdrawal
 * fee is the only thing that earns it back. So a wallet balance drifting below
 * what users are owed is expected here, and the number that matters is whether
 * net is positive -- not whether the wallet looks short.
 *
 * Withdrawals cost on two separate lines, and a coin is only ever on one of
 * them: USDT-TRC20 pays CoinsBuy a fixed commission and no gas, while every
 * other token -- and ETH, BNB, AVAX, POL, ADA, TRX, XLM, XMR, XRP -- pays gas
 * and no commission. Net counted only the commission until the actual fee was
 * read back off each transfer, which made the ERC-20 rails look free.
 */
export const CryptoRailsCard: React.FC = () => {
  const { data: profit, isLoading } = useGetCryptoProfitQuery();
  const { data: feeData } = useGetCryptoWithdrawFeeQuery();
  const [saveFee, { isLoading: isSaving }] = useSetCryptoWithdrawFeeMutation();

  const { data: minData } = useGetIbMinWithdrawQuery();
  const [saveMin, { isLoading: isSavingMin }] = useSetIbMinWithdrawMutation();

  const [fee, setFee] = useState("");
  const [ibMin, setIbMin] = useState("");

  // Only seeds the input; typing must not be overwritten by a refetch.
  useEffect(() => {
    if (feeData) setFee(String(feeData.cryptoWithdrawFee));
  }, [feeData]);
  useEffect(() => {
    if (minData) setIbMin(String(minData.ibMinWithdraw));
  }, [minData]);

  const onSaveMin = async () => {
    const value = Number(ibMin);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Minimum must be zero or more");
      return;
    }
    try {
      await saveMin(value).unwrap();
      toast.success("IB minimum withdrawal updated");
    } catch {
      toast.error("Could not update the IB minimum withdrawal");
    }
  };

  const onSave = async () => {
    const value = Number(fee);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Withdrawal fee must be zero or more");
      return;
    }
    try {
      await saveFee(value).unwrap();
      toast.success("Withdrawal fee updated");
    } catch {
      toast.error("Could not update the withdrawal fee");
    }
  };

  const isNegative = (profit?.totals.net ?? 0) < 0;
  const flowTotal = profit ? profit.totals.revenue + profit.totals.cost : 0;
  const revenueShare = flowTotal > 0 ? (profit!.totals.revenue / flowTotal) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
            <Bitcoin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Crypto Rails</h3>
            <p className="text-sm text-muted-foreground">
              CoinsBuy deposits and withdrawals: what they earned and cost
            </p>
          </div>
        </div>
        {profit && (
          <Badge
            className={`w-fit px-3 py-1 text-sm ${
              isNegative
                ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Net {usd(profit.totals.net)}
          </Badge>
        )}
      </div>

      <CardContent className="space-y-6 p-6">
        {isLoading || !profit ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Deposits */}
            <div className="space-y-3 rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  Deposits
                </div>
                <Badge variant="secondary">{profit.deposits.count}</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {usd(profit.deposits.volume)}
              </p>
              <div className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                −{usd(profit.deposits.commissionPaid)} commission
              </div>
            </div>

            {/* Withdrawals */}
            <div className="space-y-3 rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="rounded-lg bg-purple-100 p-1.5 text-purple-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  Withdrawals
                </div>
                <Badge variant="secondary">{profit.withdrawals.count}</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {usd(profit.withdrawals.volume)}
              </p>
              <div className="space-y-1">
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  +{usd(profit.withdrawals.serviceFeesEarned)} service fees
                </div>
                {/* Only the withdrawals the merchant wallet paid gas on. On BTC,
                    LTC, DASH, BCH, DOGE, ZEC, ALGO, SOL and TON the fee comes
                    out of the payout and the user bears it, so those contribute
                    nothing here -- but every token, and ETH, BNB, TRX and the
                    rest, carries no CoinsBuy commission and this IS their cost. */}
                {profit.withdrawals.networkFeesPaid > 0 && (
                  <div className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    −{usd(profit.withdrawals.networkFeesPaid)} network fees
                  </div>
                )}
              </div>
            </div>

            {/* Net */}
            <div
              className={`space-y-3 rounded-xl border p-5 ${
                isNegative
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-emerald-200 bg-emerald-50/60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div
                  className={`rounded-lg p-1.5 ${
                    isNegative ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Scale className="h-4 w-4" />
                </div>
                Net
              </div>
              <p
                className={`text-2xl font-bold ${
                  isNegative ? "text-destructive" : "text-emerald-600"
                }`}
              >
                {usd(profit.totals.net)}
              </p>
              <div className="space-y-1.5">
                <div className="flex h-2 overflow-hidden rounded-full bg-destructive/30">
                  <div className="h-full bg-emerald-500" style={{ width: `${revenueShare}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{usd(profit.totals.revenue)} earned</span>
                  <span>{usd(profit.totals.cost)} paid</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Settings
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border bg-muted/20 p-5">
              <Label htmlFor="cryptoWithdrawFee">Withdrawal service fee (USD)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="cryptoWithdrawFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="bg-background pl-7"
                  />
                </div>
                <Button onClick={onSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A flat amount, taken from every crypto withdrawal before the payout is
                created. It has to cover the deposit commission above, so check Net
                after changing it.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-5">
              <Label htmlFor="ibMinWithdraw">IB wallet minimum withdrawal (USD)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="ibMinWithdraw"
                    type="number"
                    min="0"
                    step="0.01"
                    value={ibMin}
                    onChange={(e) => setIbMin(e.target.value)}
                    className="bg-background pl-7"
                  />
                </div>
                <Button onClick={onSaveMin} disabled={isSavingMin}>
                  {isSavingMin ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The smallest amount an IB can withdraw from their commission wallet.
                Applies to the IB wallet only; the crypto wallet has no minimum.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
