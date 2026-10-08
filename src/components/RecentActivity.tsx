import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { RecentActivityExport } from "./RecentActivityExport";
import { useGetTransactionsQuery } from "@/API/transactions.api";

interface ActivityItem {
  id: number;
  timestamp: string;
  activity: string;
  client: string;
  status: "approved" | "pending" | "rejected";
  amount: number;
}

const getStatusColor = (status: ActivityItem["status"]) => {
  switch (status) {
    case "approved":
      return "bg-success text-success-foreground";
    case "pending":
      return "bg-warning text-warning-foreground";
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export function RecentActivity() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetTransactionsQuery({
    getAllPending: false,
  });

  // Newest deposits and withdrawals first. The export gets all of them, the
  // table only the first five.
  const activities = useMemo<ActivityItem[]>(() => {
    if (!data) return [];
    return [...data]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((t) => ({
        id: t.id,
        timestamp: t.createdAt,
        activity: t.transactionType === "DEPOSIT" ? "Deposit" : "Withdrawal",
        client: t.name,
        status: t.transactionStatus.toLowerCase() as ActivityItem["status"],
        amount: Number(t.amount) || 0,
      }));
  }, [data]);

  const displayActivities = activities.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest client deposits and withdrawals</p>
        </div>
        <div className="flex gap-2">
          <RecentActivityExport activities={activities} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/deposit-history")}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Date</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Action</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Client Name</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Amount</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-sm text-muted-foreground">
                  Loading recent activity…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-sm text-destructive">
                  Failed to load recent activity.
                </td>
              </tr>
            )}
            {!isLoading && !isError && displayActivities.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-sm text-muted-foreground">
                  No activity yet.
                </td>
              </tr>
            )}
            {displayActivities.map((activity, index) => (
              <tr key={activity.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${index === displayActivities.length - 1 ? 'border-b-0' : ''}`}>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    {format(new Date(activity.timestamp), "yyyy-MM-dd HH:mm")}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-foreground">{activity.activity}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-foreground">{activity.client}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-foreground">{formatCurrency(activity.amount)}</span>
                </td>
                <td className="py-4 px-4">
                  <Badge className={`${getStatusColor(activity.status)} capitalize font-medium px-3 py-1`}>
                    {activity.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
