import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const financialStats = [
  {
    title: "Broker Wallet Balance",
    value: "$1,250,000",
    change: "+3.4%",
    changeType: "positive" as const,
    icon: Wallet,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    title: "Total Deposits",
    value: "$2.4M",
    change: "+12.8%",
    changeType: "positive" as const,
    icon: TrendingUp,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    title: "Total Withdrawals",
    value: "$1.8M",
    change: "+7.2%",
    changeType: "positive" as const,
    icon: TrendingDown,
    iconColor: "bg-red-100 text-red-600",
  },
  {
    title: "Net Profit",
    value: "$600K",
    change: "+18.5%",
    changeType: "positive" as const,
    icon: DollarSign,
    iconColor: "bg-emerald-100 text-emerald-600",
  },
];

export function FinancialSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {financialStats.map((stat) => (
        <Card key={stat.title} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className={`w-11 h-11 rounded-xl ${stat.iconColor} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/30">
              <span
                className={`text-sm font-medium inline-flex items-center gap-1 ${
                  stat.changeType === "positive"
                    ? "text-success"
                    : stat.changeType === "negative"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {stat.changeType === "positive" && "↗"}
                {stat.change} vs last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}