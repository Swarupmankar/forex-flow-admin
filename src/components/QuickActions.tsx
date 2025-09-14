import { FileCheck, TrendingUp, TrendingDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const quickActions = [
  {
    title: "Approve Pending KYC",
    description: "47 requests waiting",
    icon: FileCheck,
    iconColor: "text-orange-600",
    buttonText: "Review KYC",
  },
  {
    title: "Review Deposits",
    description: "15 pending deposits",
    icon: TrendingUp,
    iconColor: "text-green-600",
    buttonText: "Review Deposits",
  },
  {
    title: "Review Withdrawals",
    description: "8 pending withdrawals",
    icon: TrendingDown,
    iconColor: "text-red-600",
    buttonText: "Review Withdrawals",
  },
  {
    title: "Send Notification",
    description: "Broadcast to clients",
    icon: Bell,
    iconColor: "text-blue-600",
    buttonText: "Send Message",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickActions.map((action) => (
        <Card key={action.title} className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{action.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-9 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 font-medium"
              >
                {action.buttonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}