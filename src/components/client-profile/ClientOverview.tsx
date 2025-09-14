import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Client } from "@/data/clients";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Shield,
  Clock,
  Target,
  AlertTriangle
} from "lucide-react";

interface ClientOverviewProps {
  client: Client;
}

export function ClientOverview({ client }: ClientOverviewProps) {
  const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  
  const profitPercentage = client.totalDeposits > 0 ? (client.profit / client.totalDeposits) * 100 : 0;
  const riskScore = Math.max(0, Math.min(100, 
    (client.walletBalance / 50000) * 30 + 
    (client.linkedAccounts * 10) + 
    (client.kycStatus === "approved" ? 40 : client.kycStatus === "pending" ? 20 : 0)
  ));

  const tradingMetrics = [
    {
      title: "Wallet Balance",
      value: currency(client.walletBalance),
      icon: DollarSign,
      trend: client.walletBalance > client.totalDeposits ? "up" : "down",
      color: "text-primary"
    },
    {
      title: "Total Deposits",
      value: currency(client.totalDeposits),
      icon: ArrowDownToLine,
      trend: "neutral",
      color: "text-chart-deposit"
    },
    {
      title: "Total Withdrawals", 
      value: currency(client.totalWithdrawals),
      icon: ArrowUpFromLine,
      trend: "neutral",
      color: "text-chart-withdrawal"
    },
    {
      title: "Net Profit",
      value: currency(client.profit),
      icon: client.profit >= 0 ? TrendingUp : TrendingDown,
      trend: client.profit >= 0 ? "up" : "down",
      color: client.profit >= 0 ? "text-success" : "text-destructive"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tradingMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.title === "Net Profit" && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className={profitPercentage >= 0 ? "text-success" : "text-destructive"}>
                        {profitPercentage >= 0 ? "+" : ""}{profitPercentage.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">ROI</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full bg-muted/20 ${metric.color}`}>
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Health */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Account Health & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Assessment */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Risk Assessment Score</span>
                <Badge variant={riskScore >= 70 ? "default" : riskScore >= 40 ? "secondary" : "destructive"}>
                  {riskScore >= 70 ? "Low Risk" : riskScore >= 40 ? "Medium Risk" : "High Risk"}
                </Badge>
              </div>
              <Progress value={riskScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on KYC status, account balance, and trading activity
              </p>
            </div>

            {/* Trading Performance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Active Accounts</span>
                </div>
                <p className="text-xl font-bold">{client.linkedAccounts}</p>
                <p className="text-xs text-muted-foreground">
                  {client.accounts.filter(acc => acc.status === "active").length} of {client.accounts.length} accounts active
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Compliance</span>
                </div>
                <p className={`text-xl font-bold ${
                  client.kycStatus === "approved" ? "text-success" : 
                  client.kycStatus === "pending" ? "text-warning" : "text-destructive"
                }`}>
                  {client.kycStatus === "approved" ? "100%" : 
                   client.kycStatus === "pending" ? "75%" : "25%"}
                </p>
                <p className="text-xs text-muted-foreground">KYC & verification status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                <p className="text-sm">{new Date(client.registrationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long", 
                  day: "numeric"
                })}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Age</p>
                <p className="text-sm">
                  {Math.floor((Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Activity</p>
                <p className="text-sm">
                  {client.activityLog && client.activityLog.length > 0 
                    ? new Date(client.activityLog[0].date).toLocaleDateString()
                    : "No recent activity"
                  }
                </p>
              </div>

              {client.referralCode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referral Code</p>
                  <p className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">{client.referralCode}</p>
                </div>
              )}
            </div>

            {/* Alert Section */}
            {(client.kycStatus === "rejected" || client.profit < -1000) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Attention Required</p>
                    <p className="text-xs text-muted-foreground">
                      {client.kycStatus === "rejected" ? "KYC documents rejected - client needs to resubmit." : ""}
                      {client.profit < -1000 ? "Significant trading losses detected." : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}