// TransactionDetailModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  DollarSign,
  Hash,
  Mail,
  Expand,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Transaction } from "@/features/transactions/transactions.types";
import type { TransactionRecord } from "@/pages/DepositHistory";
import { useState } from "react";

interface TransactionDetailModalProps {
  transaction: Transaction | TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  if (!transaction) return null;

  // Prefer strong-typed Transaction fields, fallback to TransactionRecord fields:
  const transactionType =
    (transaction as Transaction).transactionType ??
    (transaction as any).type ??
    null; // "DEPOSIT"/"WITHDRAW" or "deposit"/"withdrawal"

  // Normalize type to uppercase if possible
  const normalizedType =
    typeof transactionType === "string"
      ? transactionType.toUpperCase().startsWith("DEPOSIT")
        ? "DEPOSIT"
        : transactionType.toUpperCase().startsWith("WITHDRAW")
        ? "WITHDRAW"
        : transactionType.toUpperCase()
      : null;

  const transactionStatus =
    (transaction as Transaction).transactionStatus ??
    (transaction as any).status ??
    null;

  const name =
    (transaction as Transaction).name ?? (transaction as any).clientName ?? "";
  const email =
    (transaction as Transaction).email ?? (transaction as any).email ?? "";

  const amount =
    (transaction as Transaction).amount ??
    (transaction as any).amount ??
    "0.00";

  const depositProof =
    (transaction as Transaction).depositProof ??
    (transaction as any).depositProof ??
    (transaction as any).proofOfPayment ??
    null;

  const mode =
    (transaction as Transaction).mode ??
    (transaction as any).paymentMethod ??
    null;

  const utrNo =
    (transaction as Transaction).utrNo ?? (transaction as any).utrNo ?? null;

  const bankName =
    (transaction as Transaction).bankName ??
    (transaction as any).bankName ??
    null;
  const bankAccountNo =
    (transaction as Transaction).bankAccountNo ??
    (transaction as any).bankAccountNo ??
    null;
  const bankIfsc =
    (transaction as Transaction).bankIfsc ??
    (transaction as any).bankIfsc ??
    null;

  const cryptoAddress =
    (transaction as Transaction).cryptoAddress ??
    (transaction as any).cryptoAddress ??
    null;
  const cryptoNetwork =
    (transaction as Transaction).cryptoNetwork ??
    (transaction as any).cryptoNetwork ??
    null;

  const remainingBalance =
    (transaction as Transaction).remainingBalance ??
    (transaction as any).remainingBalance ??
    null;
  const balanceType =
    (transaction as Transaction).balanceType ??
    (transaction as any).withdrawBalanceType ??
    null;

  const createdAt =
    (transaction as Transaction).createdAt ?? (transaction as any).date ?? null;
  const updatedAt =
    (transaction as Transaction).updatedAt ??
    (transaction as any).updatedAt ??
    null;

  const isDeposit = normalizedType === "DEPOSIT";
  const isWithdraw = normalizedType === "WITHDRAW";

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    const s = status.toUpperCase();
    if (s === "APPROVED" || s === "COMPLETED") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (s === "PENDING") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (s === "REJECTED") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTypeBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    if (type === "DEPOSIT") {
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

  // Safe initials (avoid split on undefined)
  const initials = name
    ? name
        .toString()
        .split(" ")
        .map((p) => p?.[0] ?? "")
        .join("")
    : email
    ? email.toString().split("@")[0]?.[0] ?? ""
    : "U";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            <Badge variant="outline" className="ml-2">
              #{(transaction as any).id ?? "—"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {/* no avatar field in your type — fallback to initials safely */}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">
                    {name || email || "Client"}
                  </div>
                  {email && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Type:</span>
                {getTypeBadge(normalizedType)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <div className="text-lg font-semibold">${amount}</div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(transactionStatus as string | null)}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created:</span>
                <div className="text-sm">
                  {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Mode:</span>
                  <Badge variant="outline" className="text-xs">
                    {mode ?? "N/A"}
                  </Badge>
                </div>

                {transaction.upiId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      UPI ID:
                    </span>
                    <div className="text-sm font-medium">
                      {(transaction as any).upiId}
                    </div>
                  </div>
                )}

                {(bankName || bankAccountNo || bankIfsc) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Bank Name:
                      </span>
                      <div className="text-sm font-medium">
                        {bankName ?? "—"}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Account No:
                      </span>
                      <div className="text-sm font-mono">
                        {bankAccountNo ?? "—"}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        IFSC:
                      </span>
                      <div className="text-sm font-mono">{bankIfsc ?? "—"}</div>
                    </div>
                  </>
                )}

                {utrNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      UTR No:
                    </span>
                    <div className="text-sm font-mono">{utrNo}</div>
                  </div>
                )}

                {(cryptoAddress || cryptoNetwork) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Crypto Address:
                      </span>
                      <div className="text-sm font-mono">
                        {cryptoAddress ?? "—"}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Network:
                      </span>
                      <div className="text-sm">{cryptoNetwork ?? "—"}</div>
                    </div>
                  </>
                )}

                {(transaction as any).accountIdentifier && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Account Identifier:
                    </span>
                    <div className="text-sm">
                      {(transaction as any).accountIdentifier}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proof of Payment (DEPOSIT only) */}
          {isDeposit && depositProof && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Proof of Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setImageModalOpen(true)}
                  >
                    <img
                      src={depositProof}
                      alt="Proof of payment"
                      className="w-full max-w-md rounded-lg border hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 rounded-lg transition-opacity">
                      <div className="bg-white/90 rounded-full p-2">
                        <Expand className="h-4 w-4 text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to view full size
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remaining Balance (WITHDRAW only) */}
          {isWithdraw && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Balance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Remaining Balance:
                  </span>
                  <span className="text-sm font-medium">
                    ${remainingBalance ?? "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Balance Type:
                  </span>
                  <Badge variant="outline">{balanceType ?? "N/A"}</Badge>
                </div>

                {(transaction as any).transactionStatus === "REJECTED" &&
                  (transaction as any).rejectionReason && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">
                        Rejection Reason
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                        {(transaction as any).rejectionReason}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="px-4 py-2">
            <DialogTitle>Proof of Payment</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {depositProof && (
              <img
                src={depositProof}
                alt="Proof of payment - full size"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
