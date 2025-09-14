import { useState } from "react";
import {
  Check,
  X,
  Eye,
  DollarSign,
  CreditCard,
  Clock,
  User,
  Hash,
  Building,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import type { DepositRequest } from "@/pages/DepositRequests";

interface DepositApprovalModalProps {
  request: DepositRequest;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, comments?: string) => void;
  onReject: (requestId: string, reason: string) => void;
}

export function DepositApprovalModal({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: DepositApprovalModalProps) {
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [showImageViewer, setShowImageViewer] = useState(false);

  const getPaymentMethodDetails = () => {
    switch (request.paymentMethod) {
      case "upi":
        return {
          icon: <CreditCard className="h-4 w-4" />,
          label: "UPI Payment",
          details: [
            {
              label: "UTR No",
              value: request.paymentDetails.utrNo ?? "—",
            },
            {
              label: "Payer Name",
              value: request.paymentDetails.payerName ?? "—",
            },
          ],
        };
      case "bank":
        return {
          icon: <Building className="h-4 w-4" />,
          label: "Bank Transfer",
          details: [
            {
              label: "Transaction ID",
              value: request.paymentDetails.utrNo ?? "—",
            },
            {
              label: "Payer Name",
              value: request.paymentDetails.payerName ?? "—",
            },
          ],
        };
      case "crypto":
        return {
          icon: <Wallet className="h-4 w-4" />,
          label: "Cryptocurrency",
          details: [
            { label: "Hash ID", value: request.paymentDetails.utrNo ?? "—" },
            {
              label: "Network",
              value: request.paymentDetails.cryptoNetwork ?? "—",
            },
          ],
        };
      default:
        return {
          icon: <CreditCard className="h-4 w-4" />,
          label: "Payment",
          details: [],
        };
    }
  };

  const paymentMethodInfo = getPaymentMethodDetails();

  const handleApprove = () => {
    onApprove(request.id, comments);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(request.id, rejectReason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Deposit Request - {request.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Request Details */}
          <div className="space-y-4">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.avatar} />
                    <AvatarFallback>
                      {(
                        (request.clientName ?? "")
                          .split(" ")
                          .map((n) => (n ? n[0] : ""))
                          .join("") || "U"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {request.clientName ?? "Unknown"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.email ?? "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {paymentMethodInfo.icon}
                  {paymentMethodInfo.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Amount:</span>
                  <span className="text-xl font-bold text-primary">
                    ${request.amount}
                  </span>
                </div>

                <Separator />

                {paymentMethodInfo.details.map((detail, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {detail.label}:
                    </span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(request.submittedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Status:</span>
                  <Badge
                    variant={
                      request.status === "pending" ? "outline" : "default"
                    }
                    className={
                      request.status === "pending"
                        ? "text-yellow-600 border-yellow-600"
                        : request.status === "approved"
                        ? "text-green-600 border-green-600"
                        : "text-red-600 border-red-600"
                    }
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Proof & Actions */}
          <div className="space-y-4">
            {/* Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-4 w-4" />
                  Payment Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.paymentProof ? (
                  <div className="space-y-3">
                    <img
                      src={request.paymentProof}
                      alt="Payment proof"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowImageViewer(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>

                      {/* Removed "open in new tab" anchor — replaced with a button that also opens the modal */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowImageViewer(true)}
                      >
                        View Original
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No payment proof uploaded
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {request.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showRejectForm ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="comments">Comments (Optional)</Label>
                        <Textarea
                          id="comments"
                          placeholder="Add any comments about this deposit..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleApprove}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectForm(true)}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rejectReason">Rejection Reason *</Label>
                        <Textarea
                          id="rejectReason"
                          placeholder="Please provide a reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectReason.trim()}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
