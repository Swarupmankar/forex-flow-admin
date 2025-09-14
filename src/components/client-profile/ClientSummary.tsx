import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react";
import type { Client } from "@/features/users/users.types";

interface ClientSummaryProps {
  client: Client;
}

export function ClientSummary({ client }: ClientSummaryProps) {
  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const getComplianceStatus = () => {
    const { kycDocuments } = client;
    if (!kycDocuments)
      return {
        status: "incomplete",
        label: "Incomplete",
        variant: "destructive" as const,
      };

    const idFrontApproved = kycDocuments.idDocument?.frontStatus === "approved";
    const idBackApproved = kycDocuments.idDocument?.backStatus === "approved";
    const selfieApproved = kycDocuments.selfieProof?.status === "approved";
    const addressApproved = kycDocuments.proofOfAddress?.status === "approved";

    if (
      idFrontApproved &&
      idBackApproved &&
      selfieApproved &&
      addressApproved
    ) {
      return {
        status: "compliant",
        label: "Fully Compliant",
        variant: "success" as const,
      };
    }

    const approvedCount = [
      idFrontApproved,
      idBackApproved,
      selfieApproved,
      addressApproved,
    ].filter(Boolean).length;
    if (approvedCount >= 2) {
      return {
        status: "partial",
        label: "Partially Compliant",
        variant: "warning" as const,
      };
    }

    return {
      status: "non-compliant",
      label: "Non-Compliant",
      variant: "destructive" as const,
    };
  };

  const compliance = getComplianceStatus();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-xl font-semibold">
                {currency(client.walletBalance)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary/60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Deposits</p>
              <p className="text-xl font-semibold text-success">
                {currency(client.totalDeposits)}
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
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
              <p className="text-xl font-semibold text-destructive">
                {currency(client.totalWithdrawals)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-destructive/60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p
                className={`text-xl font-semibold ${
                  client.profit >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {currency(client.profit)}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-primary/60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
