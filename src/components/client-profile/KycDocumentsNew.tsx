import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useReviewKycDocumentMutation,
  useDeleteKycDocumentMutation,
} from "@/API/kyc.api";
import type { KycDocType, KycReviewAction } from "@/features/kyc/kyc.types";

type DocStatus = "approved" | "pending" | "rejected";

type KycDocumentsUi = {
  idDocument?: {
    id: number;
    type: string;
    front?: string | null;
    back?: string | null;
    frontStatus: DocStatus;
    backStatus: DocStatus;
    frontApprovedAt?: string | null;
    frontApprovedBy?: string | null;
    frontRejectionReason?: string | null;
    backApprovedAt?: string | null;
    backApprovedBy?: string | null;
    backRejectionReason?: string | null;
  };
  selfieProof?: {
    type: string;
    document?: string | null;
    status: DocStatus;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectionReason?: string | null;
  };
  proofOfAddress?: {
    type: string;
    document?: string | null;
    status: DocStatus;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectionReason?: string | null;
    kycId: number | string;
  };
};

interface KycDocumentsNewProps {
  kycId: number;
  client: any;
  kycDocuments?: KycDocumentsUi;
  loading?: boolean;
  address?: string | null;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  documentSide?: string;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
}

function toApiDocType(docType: string, side?: string): KycDocType | null {
  const t = docType.toLowerCase();
  if (t.includes("id document") || t.includes("passport")) {
    if (side?.toLowerCase() === "front") return "passportFront";
    if (side?.toLowerCase() === "back") return "passportBack";
    return null;
  }
  if (t.includes("selfie")) return "selfieWithId";
  if (t.includes("address proof")) return "utilityBill";
  return null;
}

function ApprovalModal({
  isOpen,
  onClose,
  documentType,
  documentSide,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (kind: "approve" | "reject") => {
    try {
      setIsSubmitting(true);
      if (kind === "approve") onApprove(reason);
      else onReject(reason);
    } finally {
      setIsSubmitting(false);
      setReason("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {documentType} {documentSide ? `- ${documentSide}` : ""} Approval
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add a comment (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => submit("approve")}
              className="flex-1"
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => submit("reject")}
              variant="destructive"
              className="flex-1"
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KycDocumentsNew({
  client,
  kycDocuments,
  loading,
  address,
  kycId,
}: KycDocumentsNewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    type: string;
    side?: string;
    docType: string;
  }>({ isOpen: false, type: "", docType: "" });
  const { toast } = useToast();

  const [reviewDoc, { isLoading: isReviewing }] =
    useReviewKycDocumentMutation();
  const [deleteDoc, { isLoading: isDeleting }] = useDeleteKycDocumentMutation();

  const getStatusBadge = (status: DocStatus) => {
    if (status == null) return null;
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const handleApproval = (
    type: string,
    side: string | undefined,
    docType: string
  ) => {
    setApprovalModal({ isOpen: true, type, side, docType });
  };

  const handleApprove = async (reason: string) => {
    const apiDoc = toApiDocType(approvalModal.docType, approvalModal.side);
    if (!apiDoc) return;
    const body = { documentType: apiDoc, action: "APPROVE" as KycReviewAction };
    console.log("[APPROVE PAYLOAD]", { kycId, body });
    try {
      await reviewDoc({ kycId, body }).unwrap();
      toast({
        title: "Approved",
        description: `${approvalModal.docType}${
          approvalModal.side ? ` - ${approvalModal.side}` : ""
        } approved.`,
      });
    } catch (e: any) {
      toast({
        title: "Approval failed",
        description: String(
          e?.data?.message ?? e?.message ?? "Something went wrong"
        ),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reason: string) => {
    const apiDoc = toApiDocType(approvalModal.docType, approvalModal.side);
    if (!apiDoc) return;
    const body = {
      documentType: apiDoc,
      action: "REJECT" as KycReviewAction,
      rejectionReason: reason || undefined,
    };
    try {
      await reviewDoc({ kycId, body }).unwrap();
      toast({
        title: "Rejected",
        description: `${approvalModal.docType}${
          approvalModal.side ? ` - ${approvalModal.side}` : ""
        } rejected.${reason ? ` Reason: ${reason}` : ""}`,
      });
    } catch (e: any) {
      toast({
        title: "Rejection failed",
        description: String(
          e?.data?.message ?? e?.message ?? "Something went wrong"
        ),
        variant: "destructive",
      });
    }
  };

  /** --- Call API: Delete --- */
  const handleDelete = async (docType: KycDocType) => {
    if (!kycId) return;
    const body = { docType };
    console.log("Deleting doc:", { kycId, body });
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDoc({ kycId, body }).unwrap();
      toast({
        title: "Deleted",
        description: "Document deleted successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: String(
          e?.data?.message ?? e?.message ?? "Something went wrong"
        ),
        variant: "destructive",
      });
    }
  };

  const openInNewTab = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const noDocUrls =
    !kycDocuments?.idDocument?.front &&
    !kycDocuments?.idDocument?.back &&
    !kycDocuments?.selfieProof?.document &&
    !kycDocuments?.proofOfAddress?.document;

  const allStatusesNull = (() => {
    const s: DocStatus[] = [];
    if (kycDocuments?.idDocument?.front)
      s.push(kycDocuments.idDocument.frontStatus);
    if (kycDocuments?.idDocument?.back)
      s.push(kycDocuments.idDocument.backStatus);
    if (kycDocuments?.selfieProof?.document)
      s.push(kycDocuments.selfieProof.status);
    if (kycDocuments?.proofOfAddress?.document)
      s.push(kycDocuments.proofOfAddress.status);
    return s.length > 0 && s.every((v) => v == null);
  })();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">KYC Documents</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[60ch]">
                {address?.trim() ? address : "No address provided"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading KYC…</div>
          ) : noDocUrls || allStatusesNull ? (
            <div className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Row 1: Passport Front & Back */}
              {kycDocuments?.idDocument &&
                (kycDocuments.idDocument.front ||
                  kycDocuments.idDocument.back) && (
                  <div>
                    <h4 className="font-medium mb-3">Passport</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front */}
                      {kycDocuments.idDocument.front && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Front Side
                            </span>
                            {kycDocuments.idDocument.frontStatus ===
                              "rejected" &&
                              kycDocuments.idDocument.frontRejectionReason && (
                                <p className="text-sm text-destructive">
                                  Reason:{" "}
                                  {kycDocuments.idDocument.frontRejectionReason}
                                </p>
                              )}

                            <div className="flex items-center gap-2">
                              {getStatusBadge(
                                kycDocuments.idDocument.frontStatus
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete("passportFront")}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="relative group rounded-md overflow-hidden border">
                            <a
                              href={kycDocuments.idDocument.front}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                              title="Open in new tab"
                            >
                              <img
                                src={kycDocuments.idDocument.front}
                                alt="ID Front"
                                className="w-full aspect-[3/2] object-cover transition-transform group-hover:scale-[1.01]"
                              />
                            </a>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  openInNewTab(kycDocuments.idDocument!.front)
                                }
                                className="shadow"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>
                          {kycDocuments.idDocument.frontStatus ===
                            "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproval(
                                    "front",
                                    "Front",
                                    "ID Document"
                                  )
                                }
                                className="flex-1"
                                disabled={isReviewing}
                              >
                                Review
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Back */}
                      {kycDocuments.idDocument.back && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Back Side
                            </span>
                            {kycDocuments.idDocument.backStatus ===
                              "rejected" &&
                              kycDocuments.idDocument.backRejectionReason && (
                                <p className="bg-gray-200 p-2 rounded-xl text-sm  text-destructive">
                                  Reason:{" "}
                                  {kycDocuments.idDocument.backRejectionReason}
                                </p>
                              )}
                            <div className="flex items-center gap-2">
                              {getStatusBadge(
                                kycDocuments.idDocument.backStatus
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete("passportBack")}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="relative group rounded-md overflow-hidden border">
                            <a
                              href={kycDocuments.idDocument.back}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                              title="Open in new tab"
                            >
                              <img
                                src={kycDocuments.idDocument.back}
                                alt="ID Back"
                                className="w-full aspect-[3/2] object-cover transition-transform group-hover:scale-[1.01]"
                              />
                            </a>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  openInNewTab(kycDocuments.idDocument!.back)
                                }
                                className="shadow"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>
                          {kycDocuments.idDocument.backStatus === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproval("back", "Back", "ID Document")
                                }
                                className="flex-1"
                                disabled={isReviewing}
                              >
                                Review
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Row 2: Selfie Proof */}
              {kycDocuments?.selfieProof?.document && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Selfie Proof</h4>
                    <div className="flex items-center gap-2">
                      {kycDocuments.selfieProof.status === "rejected" &&
                        kycDocuments.selfieProof.rejectionReason && (
                          <p className="text-sm text-destructive mt-1">
                            Reason: {kycDocuments.selfieProof.rejectionReason}
                          </p>
                        )}

                      {getStatusBadge(kycDocuments.selfieProof.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete("selfieWithId")}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="max-w-md">
                    <div className="relative group rounded-md overflow-hidden border">
                      <a
                        href={kycDocuments.selfieProof.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        title="Open in new tab"
                      >
                        <img
                          src={kycDocuments.selfieProof.document}
                          alt="Selfie Proof"
                          className="w-full aspect-[3/2] object-cover transition-transform group-hover:scale-[1.01]"
                        />
                      </a>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 rounded-md">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            openInNewTab(kycDocuments.selfieProof!.document)
                          }
                          className="shadow"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                  {kycDocuments.selfieProof.status === "pending" && (
                    <div className="flex gap-1 mt-2 max-w-md">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApproval("selfie", undefined, "Selfie Proof")
                        }
                        className="flex-1"
                        disabled={isReviewing}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Address (full string) */}
              <div>
                <h4 className="font-medium mb-3">Address</h4>
                <div className="h-10 rounded-md border bg-muted/20 px-3 text-sm flex items-center">
                  {address?.trim() ? address : "No address provided"}
                </div>
              </div>

              {/* Row 4: Address Proof */}
              {kycDocuments?.proofOfAddress?.document && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Address Proof</h4>
                    <div className="flex items-center gap-2">
                      {kycDocuments.proofOfAddress.status === "rejected" &&
                        kycDocuments.proofOfAddress.rejectionReason && (
                          <p className="text-sm text-destructive mt-1">
                            Reason:{" "}
                            {kycDocuments.proofOfAddress.rejectionReason}
                          </p>
                        )}

                      {getStatusBadge(kycDocuments.proofOfAddress.status)}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete("utilityBill")}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="max-w-md">
                    <div className="relative group rounded-md overflow-hidden border">
                      <a
                        href={kycDocuments.proofOfAddress.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        title="Open in new tab"
                      >
                        <img
                          src={kycDocuments.proofOfAddress.document}
                          alt="Proof of Address"
                          className="w-full aspect-[3/2] object-cover transition-transform group-hover:scale-[1.01]"
                        />
                      </a>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 rounded-md">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            openInNewTab(kycDocuments.proofOfAddress!.document)
                          }
                          className="shadow"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                  {kycDocuments.proofOfAddress.status === "pending" && (
                    <div className="flex gap-1 mt-2 max-w-md">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleApproval("address", undefined, "Address Proof")
                        }
                        className="flex-1"
                        disabled={isReviewing}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* (Preview dialog kept for backward compatibility) */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {preview && (
            <img
              src={preview}
              alt="Document preview"
              className="rounded-md border object-contain w-full"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() =>
          setApprovalModal({ isOpen: false, type: "", docType: "" })
        }
        documentType={approvalModal.docType}
        documentSide={approvalModal.side}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
