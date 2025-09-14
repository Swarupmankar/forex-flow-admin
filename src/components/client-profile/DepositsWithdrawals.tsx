// depositandwithdrawls.tsx (fixed props)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Search, Download } from "lucide-react";
import { useState } from "react";
// Use the canonical Client type so shapes line up with the rest of the app
import type { Client } from "@/features/users/users.types";

interface DepositsWithdrawalsProps {
  client: Client;
  transactions?: Client["transactions"];
  totalDeposit?: string;
  totalWithdraw?: string;
  loading?: boolean;
}

export function DepositsWithdrawals({
  client,
  transactions = [],
  totalDeposit = "0",
  totalWithdraw = "0",
  loading = false,
}: DepositsWithdrawalsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "withdrawal">(
    "all"
  );

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const filteredTransactions = (transactions ?? []).filter((transaction) => {
    const matchesSearch =
      (transaction.account ?? "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (transaction.method ?? "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === "all" || transaction.type === activeTab;

    return matchesSearch && matchesTab;
  });

  // status in Client.transactions is "approved" | "pending" | "rejected"
  const getStatusBadge = (status: "approved" | "pending" | "rejected") => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            Rejected
          </Badge>
        );
    }
  };

  const totalDeposits = (transactions ?? [])
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const totalWithdrawals = (transactions ?? [])
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const completedDeposits = (transactions ?? []).filter(
    (t) => t.type === "deposit" && t.status === "approved"
  ).length;
  const completedWithdrawals = (transactions ?? []).filter(
    (t) => t.type === "withdrawal" && t.status === "approved"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-xl font-semibold text-success">
                  {currency(totalDeposits)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Withdrawals
                </p>
                <p className="text-xl font-semibold text-destructive">
                  {currency(totalWithdrawals)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Completed Deposits
              </p>
              <p className="text-xl font-semibold">{completedDeposits}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Completed Withdrawals
              </p>
              <p className="text-xl font-semibold">{completedWithdrawals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Transaction Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.date
                            ? new Date(transaction.date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.type === "deposit" ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <span className="capitalize">
                              {transaction.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              transaction.type === "deposit"
                                ? "text-success"
                                : "text-destructive"
                            }
                          >
                            {transaction.type === "deposit" ? "+" : "-"}
                            {currency(transaction.amount ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.method ?? "-"}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.account ?? "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            // ensure the status passed matches the expected union
                            transaction.status as
                              | "approved"
                              | "pending"
                              | "rejected"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        {(transactions ?? []).length === 0
                          ? "No transactions found"
                          : "No transactions match your search"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
