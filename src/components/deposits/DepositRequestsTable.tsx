import { Eye, Clock, DollarSign, CreditCard } from "lucide-react";
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
import type { DepositRequest } from "@/pages/DepositRequests";
import {
  exportToCSV,
  exportToPDF,
  generateExportFilename,
  formatDateForExport,
  formatStatusForExport,
} from "@/lib/export-utils";

interface DepositRequestsTableProps {
  requests: DepositRequest[];
  onViewDetails: (request: DepositRequest) => void;
}

export function exportDepositRequests(
  requests: DepositRequest[],
  format: "csv" | "pdf"
) {
  const headers = [
    "Client Name",
    "Email",
    "Amount",
    "Currency",
    "Payment Method",
    "Status",
    "Submitted Date",
  ];
  const rows = requests.map((request) => [
    request.clientName,
    request.email,
    request.amount,
    request.paymentMethod.toUpperCase(),
    formatStatusForExport(request.status),
    formatDateForExport(request.submittedAt),
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("deposit_requests"),
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

export function DepositRequestsTable({
  requests,
  onViewDetails,
}: DepositRequestsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "upi":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            UPI
          </Badge>
        );
      case "bank-transfer":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Bank Transfer
          </Badge>
        );
      case "crypto":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Crypto
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (requests.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No deposit requests found
          </h3>
          <p className="text-muted-foreground">
            No deposit requests match your current filters.
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
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback className="text-xs">
                        {(
                          (request.clientName ?? "")
                            .split(" ")
                            .map((n) => (n ? n[0] : ""))
                            .join("") || "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {request.clientName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {request.id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">
                    ${request.amount}
                  </div>
                </TableCell>
                <TableCell>
                  {getPaymentMethodBadge(request.paymentMethod)}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(request.submittedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(request)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
