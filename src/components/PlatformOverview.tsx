import { Users, UserCheck, FileX, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const overviewStats = [
  {
    title: "Total Clients",
    value: "1,254",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Users,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    title: "Active Trading Accounts",
    value: "892",
    change: "+5.1%",
    changeType: "positive" as const,
    icon: UserCheck,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    title: "Pending KYC Requests",
    value: "47",
    change: "-2.3%",
    changeType: "negative" as const,
    icon: FileX,
    iconColor: "bg-orange-100 text-orange-600",
  },
  {
    title: "Total Account Types",
    value: "4",
    change: "0%",
    changeType: "neutral" as const,
    icon: Settings2,
    iconColor: "bg-purple-100 text-purple-600",
  },
];

export function PlatformOverview() {
  return (
    <div className="bg-card rounded-lg shadow-sm border p-6 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Platform Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quick snapshot of broker operations and client metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat) => (
          <Card key={stat.title} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl ${stat.iconColor} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
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
                  {stat.changeType === "negative" && "↘"}
                  {stat.change} vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}