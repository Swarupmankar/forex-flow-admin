import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Network,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FinancialSummaryCardsProps {
  data: {
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
    ibPayouts: number;
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

type SummaryCard = {
  title: string;
  amount: number;
  hint: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  amountClass?: string;
};

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  const isLoss = data.netProfit < 0;

  const cards: SummaryCard[] = [
    {
      title: "Total Deposits",
      amount: data.totalDeposits,
      hint: "Approved client deposits",
      icon: ArrowDownToLine,
      accent: "bg-blue-500",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Withdrawals",
      amount: data.totalWithdrawals,
      hint: "Approved client withdrawals",
      icon: ArrowUpFromLine,
      accent: "bg-purple-500",
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      title: "Net Profit",
      amount: data.netProfit,
      hint: "Deposits − withdrawals + commission − referral payouts",
      icon: isLoss ? TrendingDown : TrendingUp,
      accent: isLoss ? "bg-red-500" : "bg-emerald-500",
      iconBg: isLoss ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600",
      amountClass: isLoss ? "text-destructive" : "text-emerald-600",
    },
    {
      title: "IB Payouts",
      amount: data.ibPayouts,
      hint: "Commission credited to IB wallets",
      icon: Network,
      accent: "bg-amber-500",
      iconBg: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="relative overflow-hidden transition-shadow duration-200 hover:shadow-md"
        >
          <div className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <div className={`rounded-lg p-2 ${card.iconBg}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${card.amountClass ?? "text-foreground"}`}>
                {formatCurrency(card.amount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
