import { useState } from "react";
import { format } from "date-fns";
import { Eye, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WithdrawalRequest } from "@/pages/Withdrawals";

interface WithdrawalsTableProps {
  withdrawals: WithdrawalRequest[];
  selectedWithdrawals: string[];
  onSelectionChange: (selected: string[]) => void;
  onViewWithdrawal: (withdrawal: WithdrawalRequest) => void;
  onStatusUpdate: (id: string, status: "approved" | "pending") => void;
}

export function WithdrawalsTable({
  withdrawals,
  selectedWithdrawals,
  onSelectionChange,
  onViewWithdrawal,
  onStatusUpdate,
}: WithdrawalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedWithdrawals = withdrawals.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(paginatedWithdrawals.map((w) => w.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedWithdrawals, id]);
    } else {
      onSelectionChange(
        selectedWithdrawals.filter((selectedId) => selectedId !== id)
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      referral: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      wallet: "bg-chart-1/10 text-chart-1 border-chart-1/20",
      bank: "bg-chart-3/10 text-chart-3 border-chart-3/20",
      upi: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    };

    return (
      <Badge
        className={variants[type as keyof typeof variants] || "bg-muted/50"}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const isAllSelected =
    paginatedWithdrawals.length > 0 &&
    paginatedWithdrawals.every((w) => selectedWithdrawals.includes(w.id));

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWithdrawals.map((withdrawal) => {
              const availableBalance =
                withdrawal.remainingBalance ?? withdrawal.clientBalance ?? 0;
              const displayDate = withdrawal.submissionDate
                ? new Date(withdrawal.submissionDate)
                : null;
              return (
                <TableRow
                  key={withdrawal.id}
                  className="hover:bg-accent/5 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedWithdrawals.includes(withdrawal.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(withdrawal.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {withdrawal.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {withdrawal.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {withdrawal.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    <div>${withdrawal.amount}</div>
                    <div className="text-xs text-muted-foreground">
                      Requested:{" "}
                      {format(new Date(withdrawal.submissionDate), "MMM dd")}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(withdrawal.type)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">${availableBalance}</div>
                    <div className="text-xs text-muted-foreground">
                      Available
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize text-xs">
                        {withdrawal.destinationType}:
                      </span>
                      <span>{withdrawal.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {format(
                        new Date(withdrawal.submissionDate),
                        "MMM dd, yyyy"
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(withdrawal.submissionDate), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewWithdrawal(withdrawal)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {withdrawal.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onStatusUpdate(withdrawal.id, "approved")
                          }
                          className="h-8 w-8 p-0 text-success hover:bg-success/10"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
