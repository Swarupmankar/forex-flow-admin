import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountDetailModal } from "./AccountDetailModal";
import { TrendingUp, BarChart3, Shield, Eye, Server } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Client, TradingAccount } from "@/features/users/users.types";
import { useUpdateAccountStatusMutation } from "@/API/users.api";

import { toast } from "@/components/ui/use-toast";

interface AccountsSectionProps {
  client: Client;
  accounts: TradingAccount[];
  totalBalance: string;
  avgLeverage: string;
  loading?: boolean;
  onStatusChanged?: (
    accountId: string,
    newStatus: "ACTIVE" | "ARCHIVE"
  ) => void;
}

export function AccountsSection({
  client,
  accounts = [],
  totalBalance,
  avgLeverage,
  onStatusChanged,
}: AccountsSectionProps) {
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [accountForStatusChange, setAccountForStatusChange] =
    useState<TradingAccount | null>(null);
  const [isProcessingStatusChange, setIsProcessingStatusChange] =
    useState(false);

  const [updateAccountStatus] = useUpdateAccountStatusMutation();

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const uiAccounts = (accounts ?? []).map((acc) => ({
    api: acc,
    leverageStr: `1:${acc.leverage}`,
    balanceNum: Number(acc.fundsAvailable ?? 0),
    statusUi:
      acc.accountStatus === "ACTIVE"
        ? ("active" as const)
        : ("archive" as const),
  }));

  const totalBalanceNumber = Number(
    totalBalance ?? uiAccounts.reduce((s, a) => s + a.balanceNum, 0)
  );
  const activeAccountsCount = uiAccounts.filter(
    (a) => a.statusUi === "active"
  ).length;

  const getLeverageRisk = (leverage: string) => {
    const parts = leverage.split(":");
    const ratio = parts.length > 1 ? parseInt(parts[1], 10) : 1;
    if (ratio >= 200)
      return { level: "High", color: "text-destructive", progress: 85 };
    if (ratio >= 100)
      return { level: "Medium", color: "text-warning", progress: 60 };
    return { level: "Low", color: "text-success", progress: 30 };
  };

  const handleViewDetails = (apiAccount: TradingAccount) => {
    setSelectedAccount(apiAccount);
    setIsModalOpen(true);
  };

  const openStatusDialog = (account: TradingAccount) => {
    setAccountForStatusChange(account);
    setStatusDialogOpen(true);
  };

  const performStatusChange = async (
    account: TradingAccount,
    newStatus: "ACTIVE" | "ARCHIVE"
  ) => {
    const body = {
      userId: (client as any)?.id ?? (client as any)?.userId ?? null,
      tradingAccountId: account.id,
      accountStatus: newStatus,
    };

    try {
      setIsProcessingStatusChange(true);
      const resp = await updateAccountStatus(body).unwrap();

      if (onStatusChanged) {
        onStatusChanged(String(account.id), newStatus);
      }

      // success toast
      toast({
        title: `Account ${account.id} updated`,
        description: `Account status set to ${newStatus}.`,
      });
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || String(err);

      // error toast
      toast({
        title: "Failed to change account status",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsProcessingStatusChange(false);
      setStatusDialogOpen(false);
      setAccountForStatusChange(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!accountForStatusChange) return;
    const current = accountForStatusChange.accountStatus;
    const newStatus: "ACTIVE" | "ARCHIVE" =
      current === "ACTIVE" ? "ARCHIVE" : "ACTIVE";
    await performStatusChange(accountForStatusChange, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium  text-muted-foreground">
                  Total Balance
                </p>
                {currency(Number(totalBalance) || totalBalanceNumber)}
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Accounts
                </p>
                <p className="text-2xl font-bold">{activeAccountsCount}</p>
                <p className="text-xs text-muted-foreground">
                  of {uiAccounts.length} total
                </p>
              </div>
              <Shield className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Leverage
                </p>
                <p className="text-2xl font-bold">
                  1:
                  {avgLeverage}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Leverage</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const leverageStr = `1:${account.leverage}`;
                const balance = Number(account.fundsAvailable ?? 0);
                const risk = getLeverageRisk(leverageStr);

                return (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{account.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {account.accountTypes?.name ?? account.accountType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.accountType === "REAL" ? "default" : "outline"
                        }
                        className={
                          account.accountType === "REAL"
                            ? "bg-success text-success-foreground"
                            : ""
                        }
                      >
                        {account.accountType?.toUpperCase() || "REAL"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          1:{account.leverage}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${risk.color}`}
                        >
                          {risk.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {currency(balance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.accountStatus === "ACTIVE"
                            ? "default"
                            : "destructive"
                        }
                        className="capitalize"
                      >
                        {account.accountStatus.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDetails(account)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openStatusDialog(account)}
                          title={
                            account.accountStatus === "ACTIVE"
                              ? "Disable account"
                              : "Enable account"
                          }
                        >
                          <Server className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Enable/Disable Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accountForStatusChange?.accountStatus === "ACTIVE"
                ? "Disable this account?"
                : "Enable this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accountForStatusChange ? (
                <>
                  {accountForStatusChange.accountStatus === "ACTIVE"
                    ? `Disabling account ${accountForStatusChange.id} will set its status to ARCHIVE and may block trading and access until re-enabled.`
                    : `Enabling account ${accountForStatusChange.id} will set its status to ACTIVE and restore access.`}
                </>
              ) : (
                "Change account status."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingStatusChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isProcessingStatusChange}
              className={
                accountForStatusChange?.accountStatus === "ACTIVE"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
            >
              {isProcessingStatusChange
                ? "Processing..."
                : accountForStatusChange?.accountStatus === "ACTIVE"
                ? "Disable account"
                : "Enable account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccountDetailModal
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
