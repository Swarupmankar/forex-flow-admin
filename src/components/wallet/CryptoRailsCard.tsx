import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useGetCryptoProfitQuery,
  useGetCryptoWithdrawFeeQuery,
  useSetCryptoWithdrawFeeMutation,
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

  const [fee, setFee] = useState("");

  // Only seeds the input; typing must not be overwritten by a refetch.
  useEffect(() => {
    if (feeData) setFee(String(feeData.cryptoWithdrawFee));
  }, [feeData]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet2 className="h-4 w-4" />
          Crypto rails
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading || !profit ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDownLeft className="h-4 w-4" />
                Deposits ({profit.deposits.count})
              </div>
              <p className="mt-1 text-lg font-semibold">
                {usd(profit.deposits.volume)}
              </p>
              <p className="text-sm text-destructive">
                −{usd(profit.deposits.commissionPaid)} commission
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4" />
                Withdrawals ({profit.withdrawals.count})
              </div>
              <p className="mt-1 text-lg font-semibold">
                {usd(profit.withdrawals.volume)}
              </p>
              <p className="text-sm text-emerald-600">
                +{usd(profit.withdrawals.serviceFeesEarned)} service fees
              </p>
              {/* Only the withdrawals the merchant wallet paid gas on. On BTC,
                  LTC, DASH, BCH, DOGE, ZEC, ALGO, SOL and TON the fee comes
                  out of the payout and the user bears it, so those contribute
                  nothing here -- but every token, and ETH, BNB, TRX and the
                  rest, carries no CoinsBuy commission and this IS their cost. */}
              {profit.withdrawals.networkFeesPaid > 0 && (
                <p className="text-sm text-destructive">
                  −{usd(profit.withdrawals.networkFeesPaid)} network fees
                </p>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">Net</div>
              <p
                className={`mt-1 text-lg font-semibold ${
                  profit.totals.net < 0 ? "text-destructive" : "text-emerald-600"
                }`}
              >
                {usd(profit.totals.net)}
              </p>
              <p className="text-sm text-muted-foreground">
                {usd(profit.totals.revenue)} earned − {usd(profit.totals.cost)} paid
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cryptoWithdrawFee">Withdrawal service fee (USD)</Label>
          <div className="flex gap-2">
            <Input
              id="cryptoWithdrawFee"
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="max-w-40"
            />
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            A flat amount, taken from every crypto withdrawal before the payout is
            created. It has to cover the deposit commission above, so check Net
            after changing it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
