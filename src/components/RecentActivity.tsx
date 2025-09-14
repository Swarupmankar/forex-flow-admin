import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { RecentActivityExport } from "./RecentActivityExport";

interface ActivityItem {
  id: string;
  timestamp: string;
  action: string;
  clientName: string;
  clientId: string;
  status: "approved" | "pending" | "rejected";
  amount?: string;
}

const recentActivities: ActivityItem[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:32",
    action: "Approved Withdrawal",
    clientName: "John Smith",
    clientId: "CL001254",
    status: "approved",
    amount: "$2,500"
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:18",
    action: "New Deposit",
    clientName: "Sarah Johnson",
    clientId: "CL001255",
    status: "approved",
    amount: "$10,000"
  },
  {
    id: "3",
    timestamp: "2024-01-15 13:45",
    action: "KYC Document Review",
    clientName: "Michael Brown",
    clientId: "CL001256",
    status: "pending"
  },
  {
    id: "4",
    timestamp: "2024-01-15 13:22",
    action: "Account Verification",
    clientName: "Emma Davis",
    clientId: "CL001257",
    status: "approved"
  },
  {
    id: "5",
    timestamp: "2024-01-15 12:58",
    action: "Withdrawal Request",
    clientName: "David Wilson",
    clientId: "CL001258",
    status: "pending",
    amount: "$5,750"
  },
  {
    id: "6",
    timestamp: "2024-01-15 12:33",
    action: "Failed Deposit",
    clientName: "Lisa Anderson",
    clientId: "CL001259",
    status: "rejected",
    amount: "$1,200"
  },
  {
    id: "7",
    timestamp: "2024-01-15 11:47",
    action: "Account Opening",
    clientName: "Robert Taylor",
    clientId: "CL001260",
    status: "approved"
  },
  {
    id: "8",
    timestamp: "2024-01-15 11:15",
    action: "Approved Deposit",
    clientName: "Jennifer White",
    clientId: "CL001261",
    status: "approved",
    amount: "$7,500"
  }
];

const getStatusVariant = (status: ActivityItem["status"]) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

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

export function RecentActivity() {
  // Show only first 5 entries for cleaner dashboard view
  const displayActivities = recentActivities.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest client actions and status updates</p>
        </div>
        <div className="flex gap-2">
          <RecentActivityExport activities={recentActivities} />
          <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">
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
              <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayActivities.map((activity, index) => (
              <tr key={activity.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${index === displayActivities.length - 1 ? 'border-b-0' : ''}`}>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground font-medium">{activity.timestamp}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-foreground">{activity.action}</span>
                </td>
                <td className="py-4 px-4">
                  <button className="text-sm font-semibold text-primary hover:underline text-left hover:text-primary/80 transition-colors">
                    {activity.clientName}
                  </button>
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