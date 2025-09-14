import { Users, CreditCard, TrendingUp, TrendingDown, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    title: "Total Clients",
    value: "1,254",
    icon: Users,
    color: "bg-chart-1",
    change: "+12%",
    changeType: "positive" as const
  },
  {
    title: "Active Trading Accounts",
    value: "892",
    icon: CreditCard,
    color: "bg-chart-2",
    change: "+8%",
    changeType: "positive" as const
  },
  {
    title: "Total Deposits",
    value: "$2.4M",
    icon: TrendingUp,
    color: "bg-chart-3",
    change: "+15%",
    changeType: "positive" as const
  },
  {
    title: "Total Withdrawals",
    value: "$1.8M",
    icon: TrendingDown,
    color: "bg-chart-withdrawal",
    change: "-5%",
    changeType: "negative" as const
  },
  {
    title: "Pending KYC",
    value: "47",
    icon: FileCheck,
    color: "bg-chart-4",
    change: "12 new",
    changeType: "neutral" as const
  }
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  stat.changeType === "positive" 
                    ? "text-success" 
                    : stat.changeType === "negative" 
                    ? "text-destructive" 
                    : "text-muted-foreground"
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}