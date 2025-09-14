import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { TransactionDetailModal } from "./TransactionDetailModal";
import type { TransactionRecord } from "@/pages/DepositHistory";
import { useState } from "react";

interface TransactionsTableProps {
  transactions: TransactionRecord[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewTransaction = (transaction: TransactionRecord) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string, amount: number) => {
    if (type === "deposit" || type === "DEPOSIT") {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <ArrowDownLeft className="h-3 w-3 mr-1" />
          Deposit
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          Withdrawal
        </Badge>
      );
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <ArrowUpRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No transactions found
          </h3>
          <p className="text-muted-foreground">
            No transactions match your current filters.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={transaction.avatar} />
                      <AvatarFallback className="text-xs">
                        {(
                          (transaction as any).clientName ??
                          (transaction as any).name ??
                          ""
                        )
                          .split(" ")
                          .map((n: string) => n?.[0] ?? "")
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {transaction.clientName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getTypeBadge(transaction.type, transaction.amount)}
                </TableCell>
                <TableCell>${transaction.amount}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {transaction.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.date}
                    </div>
                    {transaction.processedAt && (
                      <div className="text-xs text-muted-foreground">
                        Processed{" "}
                        {formatDistanceToNow(
                          new Date(transaction.processedAt),
                          { addSuffix: true }
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTransaction(transaction)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  );
}
