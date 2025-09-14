import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  TrendingUpIcon,
  Receipt,
  Target,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FinancialSummaryCardsProps {
  data: {
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
    brokerFeesEarned: number;
    spreadEarning: number;
    lossesSaved: number;
  };
}

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Deposits",
      amount: data.totalDeposits,

      icon: DollarSign,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Withdrawals",
      amount: data.totalWithdrawals,

      icon: PiggyBank,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Net Profit",
      amount: data.netProfit,

      icon: TrendingUpIcon,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Broker Fees Earned",
      amount: data.brokerFeesEarned,

      icon: Receipt,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Spread Earning",
      amount: data.spreadEarning,
      change: 0,
      icon: Target,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Losses Saved",
      amount: data.lossesSaved,
      change: 0,
      icon: Shield,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(card.amount)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
