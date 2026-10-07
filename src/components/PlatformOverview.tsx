import { Users, UserCheck, FileX, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAllUsersQuery } from "@/API/users.api";
import { useGetPlansQuery } from "@/API/accountTypes.api";

// A null value means the backend has no endpoint for this number yet. It is
// shown as a dash rather than an invented figure.
type Stat = {
  title: string;
  value: number | null;
  isLoading: boolean;
  icon: typeof Users;
  iconColor: string;
};

export function PlatformOverview() {
  const { data: users, isLoading: isUsersLoading } = useGetAllUsersQuery();
  const { data: plansData, isLoading: isPlansLoading } = useGetPlansQuery();

  const pendingKyc = users
    ? users.filter((u) => u.kycStatus?.toUpperCase() === "PENDING").length
    : null;

  const overviewStats: Stat[] = [
    {
      title: "Total Clients",
      value: users ? users.length : null,
      isLoading: isUsersLoading,
      icon: Users,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Trading Accounts",
      value: null,
      isLoading: false,
      icon: UserCheck,
      iconColor: "bg-green-100 text-green-600",
    },
    {
      title: "Pending KYC Requests",
      value: pendingKyc,
      isLoading: isUsersLoading,
      icon: FileX,
      iconColor: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Account Types",
      value: plansData ? plansData.templates.length : null,
      isLoading: isPlansLoading,
      icon: Settings2,
      iconColor: "bg-purple-100 text-purple-600",
    },
  ];

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
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl ${stat.iconColor} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">
                    {stat.isLoading
                      ? "…"
                      : stat.value === null
                      ? "—"
                      : stat.value.toLocaleString("en-US")}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
