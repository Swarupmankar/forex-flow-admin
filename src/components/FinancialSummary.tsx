import { Percent, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAccountingDetailsQuery } from "@/API/accounting.api";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export function FinancialSummary() {
  const { data, isLoading, isError } = useGetAccountingDetailsQuery();

  // A null value means the figure has not loaded. Commission Earned is the sum
  // of the commission charged on each order (brokerFeesEarned on the backend).
  const financialStats = [
    {
      title: "Commission Earned",
      value: data?.brokerFeesEarned ?? null,
      hasSource: true,
      icon: Percent,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Deposits",
      value: data?.totalDeposits ?? null,
      hasSource: true,
      icon: TrendingUp,
      iconColor: "bg-green-100 text-green-600",
    },
    {
      title: "Total Withdrawals",
      value: data?.totalWithdrawals ?? null,
      hasSource: true,
      icon: TrendingDown,
      iconColor: "bg-red-100 text-red-600",
    },
    {
      title: "Net Profit",
      value: data?.netProfit ?? null,
      hasSource: true,
      icon: DollarSign,
      iconColor: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat) => (
          <Card key={stat.title} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className={`w-11 h-11 rounded-xl ${stat.iconColor} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {isLoading && stat.hasSource
                      ? "…"
                      : stat.value === null
                      ? "—"
                      : formatCurrency(stat.value)}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {isError && (
        <p className="text-sm text-destructive">Failed to load financial summary.</p>
      )}
    </div>
  );
}
