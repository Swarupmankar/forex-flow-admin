// src/components/withdrawals/WithdrawalDetailDrawer.tsx
import { useState, useEffect } from "react";
import {
  X,
  Check,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Bitcoin,
  User,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { WithdrawalRequest } from "@/pages/Withdrawals";

interface WithdrawalDetailDrawerProps {
  request: WithdrawalRequest | null;
  onClose: () => void;
  onStatusUpdate: (
    id: string,
    status: "approved" | "pending" | "rejected",
    notes?: string
  ) => void;
}

/**
 * FieldRow - small layout helper inside the component
 * left: label, right: value. Keeps alignment consistent across different sections.
 */
function FieldRow({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 text-sm ${className}`}
      role="group"
      aria-label={label}
    >
      <div className="text-muted-foreground min-w-[110px]">{label}</div>
      <div
        className={`flex-1 text-right break-words ${
          mono ? "font-mono text-sm" : "text-sm"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function WithdrawalDetailDrawer({
  request,
  onClose,
  onStatusUpdate,
}: WithdrawalDetailDrawerProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!request) {
      setRejectionReason("");
      setShowRejectForm(false);
      return;
    }
    setRejectionReason(request.rejectionReason ?? "");
    setShowRejectForm(false);
  }, [request]);

  if (!request) return null;

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
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    const safeType = (type ?? "unknown").toLowerCase();
    const variants: Record<string, string> = {
      referral: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      wallet: "bg-chart-1/10 text-chart-1 border-chart-1/20",
      bank: "bg-chart-3/10 text-chart-3 border-chart-3/20",
      upi: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      unknown: "bg-muted/50",
    };

    const label = safeType.charAt(0).toUpperCase() + safeType.slice(1);
    return (
      <Badge className={variants[safeType] ?? variants.unknown}>{label}</Badge>
    );
  };

  const handleApprove = () => {
    onStatusUpdate(request.id, "approved");
    onClose();
  };

  const handleStartReject = () => {
    setShowRejectForm(true);
  };

  const handleCancelReject = () => {
    setRejectionReason(request.rejectionReason ?? "");
    setShowRejectForm(false);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onStatusUpdate(request.id, "rejected", rejectionReason.trim());
    onClose();
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <CreditCard className="h-5 w-5" />;
      case "upi":
        return <Smartphone className="h-5 w-5" />;
      case "crypto":
      case "wallet":
        return <Bitcoin className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const available = request.remainingBalance ?? request.clientBalance ?? 0;
  const requested = Number(request.amount ?? 0);
  const hasInsufficientBalance = requested > (Number(available) || 0);

  // Helpers to safely read paymentMethodDetails
  const p = request.paymentMethodDetails ?? {};

  // determine if this is a trading withdrawal (show trading account id)
  const isTradingAccount =
    (request.balanceType ?? "").toString().toLowerCase().includes("trading") ||
    (request.accountIdentifier ?? "").toString().toLowerCase().startsWith("tr");

  // safe initials for avatar fallback
  const initials =
    (request.clientName ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("") || "?";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Withdrawal Request</h2>
            {getStatusBadge(request.status)}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold leading-tight">
                    {request.clientName ?? "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {request.email ?? "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Withdrawal Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FieldRow
                    label="Withdrawal Amount"
                    value={
                      <div className="text-2xl font-bold">
                        ${request.amount}
                      </div>
                    }
                  />
                  <div className="mt-1">{getTypeBadge(request.type)}</div>
                </div>

                <div className="space-y-2">
                  <FieldRow
                    label="Available Balance"
                    value={
                      <div
                        className={`text-2xl font-bold ${
                          hasInsufficientBalance
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        ${available}
                      </div>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Destination (no 'Destination' field anymore) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getPaymentMethodIcon(request.destinationType)}
                Payment Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Only show Method (no separate Destination field) */}
              <div className="grid grid-cols-1 gap-3">
                <FieldRow
                  label="Method"
                  value={
                    <span className="capitalize">
                      {request.destinationType}
                    </span>
                  }
                />
              </div>

              {/* Bank fields */}
              {request.destinationType === "bank" && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <FieldRow
                    label="Account Number"
                    value={
                      <span className="font-mono">
                        {p.accountNumber ?? "—"}
                      </span>
                    }
                    mono
                  />
                  <FieldRow
                    label="IFSC"
                    value={
                      <span className="font-mono">{p.ifscCode ?? "—"}</span>
                    }
                    mono
                  />
                  <FieldRow label="Bank Name" value={p.bankName ?? "—"} />
                </div>
              )}

              {/* UPI fields */}
              {request.destinationType === "upi" && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <FieldRow
                    label="UPI ID"
                    value={<span className="font-mono">{p.upiId ?? "—"}</span>}
                    mono
                  />
                  <FieldRow
                    label="Beneficiary"
                    value={p.beneficiaryName ?? request.clientName ?? "—"}
                  />
                </div>
              )}

              {/* Crypto / Wallet fields */}
              {(request.destinationType === "crypto" ||
                request.destinationType === "wallet") && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  <FieldRow
                    label="Wallet Address"
                    value={
                      <span className="font-mono break-all">
                        {p.walletAddress ?? "—"}
                      </span>
                    }
                    mono
                  />
                  <FieldRow label="Network" value={p.networkType ?? "—"} />
                </div>
              )}

              {/* Optional: Withdrawal Reason */}
              {request.withdrawalReason && (
                <div className="pt-2">
                  <Label className="text-sm text-muted-foreground">
                    Reason
                  </Label>
                  <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm">
                    {request.withdrawalReason}
                  </div>
                </div>
              )}

              {/* Show withdraw account type and trading account id if present */}
              {(request.balanceType || request.accountIdentifier) && (
                <div className="pt-4 border-t ">
                  <FieldRow
                    label="Account Type"
                    value={request.balanceType ?? "—"}
                  />
                  {isTradingAccount && request.accountIdentifier ? (
                    <FieldRow
                      label="Trading Account ID"
                      value={
                        <span className="font-mono">
                          {request.accountIdentifier}
                        </span>
                      }
                      mono
                    />
                  ) : request.accountIdentifier ? (
                    <FieldRow
                      label="Account Identifier"
                      value={
                        <span className="font-mono">
                          {request.accountIdentifier}
                        </span>
                      }
                      mono
                    />
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show server rejection reason when request already rejected */}
          {request.status === "rejected" &&
            (request.rejectionReason ?? null) && (
              <Card>
                <CardHeader>
                  <CardTitle>Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    {request.rejectionReason}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Rejection form (shown when admin clicks Reject) */}
          {showRejectForm && (
            <Card>
              <CardHeader>
                <CardTitle>Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-sm text-muted-foreground">
                  Reason (required)
                </Label>
                <Textarea
                  placeholder="Enter reason for rejecting this withdrawal..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] mb-3"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelReject}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmReject}
                    className="flex-1"
                    disabled={rejectionReason.trim().length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Confirm Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {request.status === "pending" && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleApprove} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Approve Withdrawal
              </Button>
              <Button
                onClick={handleStartReject}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Withdrawal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
