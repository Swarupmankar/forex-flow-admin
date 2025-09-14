import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ActivityItem {
  id: string;
  date: string;
  action: string;
  status: string;
  details?: string;
}

export function ActivityTimeline({ items }: { items: ActivityItem[] | undefined }) {
  const iconFor = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <div className="mt-0.5">{iconFor(a.status)}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{a.action}</p>
                  <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString()} {a.details ? `• ${a.details}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
