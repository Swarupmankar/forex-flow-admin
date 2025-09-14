import { Wallet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WalletBalanceSectionProps {
  balances: {
    principal: number;
    netProfit: number;
  };
  replenishAmount?: number;
  onWithdraw: (walletType: "principal" | "net_profit") => void;
  onReplenish: (walletType: "principal") => void;
}

export function WalletBalanceSection({
  balances,
  replenishAmount,
  onWithdraw,
  onReplenish,
}: WalletBalanceSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!balances) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-md">
            <p className="font-medium">Live wallet data not available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Wallet balances are loading or failed to load. Actions are
              disabled until live data is available.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Principal Account */}
          <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Principal Account
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(balances.principal)}
                </p>
                {replenishAmount && replenishAmount > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    Replenish Amount: {formatCurrency(replenishAmount)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onWithdraw("principal")}
                  className="flex-1"
                  size="lg"
                >
                  Withdraw
                </Button>
                <Button
                  onClick={() => onReplenish("principal")}
                  className="flex-1"
                  size="lg"
                >
                  Replenish
                </Button>
              </div>
            </div>
          </div>

          {/* Net Profit Account */}
          <div className="border rounded-lg p-6 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Net Profit Balance
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(balances.netProfit)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onWithdraw("net_profit")}
                  className="w-full"
                  size="lg"
                >
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
