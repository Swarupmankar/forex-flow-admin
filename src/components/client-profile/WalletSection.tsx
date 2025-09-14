import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Client } from "@/data/clients";
import { TransactionHistoryTable } from "@/components/wallet/TransactionHistoryTable";
import { Transaction } from "@/pages/Wallet";
import { 
  Wallet, 
  CreditCard, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertCircle,
  Clock,
  DollarSign
} from "lucide-react";

interface WalletSectionProps {
  client: Client;
  transactions: Transaction[];
}

export function WalletSection({ client, transactions }: WalletSectionProps) {
  const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  
  // Calculate wallet metrics
  const availableBalance = client.walletBalance * 0.85; // 85% available
  const pendingBalance = client.walletBalance * 0.10;   // 10% pending
  const reservedBalance = client.walletBalance * 0.05;  // 5% reserved
  
  const profitMargin = client.totalDeposits > 0 ? (client.profit / client.totalDeposits) * 100 : 0;
  const withdrawalLimit = Math.min(client.walletBalance, 10000); // Daily withdrawal limit
  
  const paymentMethods = [
    { type: "Bank Transfer", status: "verified", last4: "****1234", default: true },
    { type: "Credit Card", status: "verified", last4: "****5678", default: false },
    { type: "Crypto Wallet", status: "pending", last4: "****9abc", default: false }
  ];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Balance */}
            <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Wallet Balance</p>
              <p className="text-4xl font-bold text-primary mb-2">{currency(client.walletBalance)}</p>
              <div className="flex items-center justify-center gap-2 text-sm">
                {client.profit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={client.profit >= 0 ? "text-success" : "text-destructive"}>
                  {profitMargin >= 0 ? "+" : ""}{profitMargin.toFixed(2)}% Total Return
                </span>
              </div>
            </div>

            {/* Balance Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium">Balance Breakdown</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Available Balance</span>
                  <span className="font-medium">{currency(availableBalance)}</span>
                </div>
                <Progress value={85} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-warning">Pending Transactions</span>
                  <span className="font-medium">{currency(pendingBalance)}</span>
                </div>
                <Progress value={10} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reserved Funds</span>
                  <span className="font-medium">{currency(reservedBalance)}</span>
                </div>
                <Progress value={5} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="sm">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Process Deposit
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Process Withdrawal
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <PiggyBank className="h-4 w-4 mr-2" />
              Transfer Funds
            </Button>
            
            <Separator />
            
            {/* Limits Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Withdrawal Limit</span>
                <span className="font-medium">{currency(withdrawalLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available to Withdraw</span>
                <span className="font-medium text-success">{currency(Math.min(availableBalance, withdrawalLimit))}</span>
              </div>
            </div>

            {/* Risk Indicator */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Account Security</span>
              </div>
              <Badge variant="default" className="text-xs">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-xl font-bold text-chart-deposit">{currency(client.totalDeposits)}</p>
              </div>
              <ArrowDownToLine className="h-8 w-8 text-chart-deposit" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                <p className="text-xl font-bold text-chart-withdrawal">{currency(client.totalWithdrawals)}</p>
              </div>
              <ArrowUpFromLine className="h-8 w-8 text-chart-withdrawal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-xl font-bold ${client.profit >= 0 ? "text-success" : "text-destructive"}`}>
                  {currency(client.profit)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${client.profit >= 0 ? "text-success" : "text-destructive"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Trades</p>
                <p className="text-xl font-bold">{client.linkedAccounts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{method.type}</p>
                    <p className="text-xs text-muted-foreground">{method.last4}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.default && <Badge variant="outline" className="text-xs">Default</Badge>}
                  <Badge 
                    variant={method.status === "verified" ? "default" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {method.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <TransactionHistoryTable transactions={recentTransactions} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No recent transactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts & Notifications */}
      {(client.walletBalance < 1000 || client.profit < -500) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Wallet Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {client.walletBalance < 1000 && (
                <p className="text-sm text-warning">⚠️ Low wallet balance - consider funding account</p>
              )}
              {client.profit < -500 && (
                <p className="text-sm text-warning">⚠️ Significant trading losses detected</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}