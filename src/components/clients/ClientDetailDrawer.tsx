import { useState } from "react";
import { X, Eye, Ban, RotateCcw, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@/data/clients";

interface ClientDetailDrawerProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailDrawer({ client, isOpen, onClose }: ClientDetailDrawerProps) {
  const [kycComment, setKycComment] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  if (!client) return null;

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success hover:bg-success/10">Approved</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return <Badge className="bg-success/10 text-success hover:bg-success/10">Active</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Pending</Badge>;
      case "disabled":
      case "error":
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApproveKyc = () => {
    console.log("Approving KYC for client:", client.id, "Comment:", kycComment);
    setKycComment("");
  };

  const handleRejectKyc = () => {
    console.log("Rejecting KYC for client:", client.id, "Comment:", kycComment);
    setKycComment("");
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[420px] overflow-y-auto p-0">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-card z-10 p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{client.name}</h2>
                <p className="text-xs text-muted-foreground">Client ID: {client.accountId}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Full Name</label>
                  <div className="text-sm text-foreground mt-1">{client.name}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <div className="text-sm text-foreground mt-1">{client.email}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <div className="text-sm text-foreground mt-1">{client.phone}</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Registration Date</label>
                  <div className="text-sm text-foreground mt-1">{formatDate(client.registrationDate)}</div>
                </div>
              </div>
            </div>

            <div className="border-b border-border"></div>

            {/* KYC Details */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">KYC Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <div className="mt-1">{getKycStatusBadge(client.kycStatus)}</div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Document Type</label>
                  <div className="text-sm text-foreground mt-1">
                    {client.kycDocuments?.idDocument?.type || 'Passport'}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Documents</label>
                  <div className="flex gap-2 mt-1">
                    {client.kycDocuments?.idDocument?.front && (
                      <div 
                        className="w-[60px] h-[40px] border border-border rounded cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => openImageModal(client.kycDocuments!.idDocument!.front)}
                      >
                        <img 
                          src={client.kycDocuments.idDocument.front} 
                          alt="ID Front"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    {client.kycDocuments?.idDocument?.back && (
                      <div 
                        className="w-[60px] h-[40px] border border-border rounded cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => openImageModal(client.kycDocuments!.idDocument!.back)}
                      >
                        <img 
                          src={client.kycDocuments.idDocument.back} 
                          alt="ID Back"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    {client.kycDocuments?.proofOfAddress?.document && (
                      <div 
                        className="w-[60px] h-[40px] border border-border rounded cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => openImageModal(client.kycDocuments!.proofOfAddress!.document)}
                      >
                        <img 
                          src={client.kycDocuments.proofOfAddress.document} 
                          alt="Proof of Address"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {client.kycStatus === "pending" && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <Textarea
                      placeholder="Add comment (optional)"
                      value={kycComment}
                      onChange={(e) => setKycComment(e.target.value)}
                      className="min-h-[60px] text-xs"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleApproveKyc}
                        size="sm"
                        className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      >
                        Approve
                      </Button>
                      <Button 
                        onClick={handleRejectKyc}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-border"></div>

            {/* Trading Accounts */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Trading Accounts</h3>
              <div className="space-y-2">
                {client.accounts && client.accounts.length > 0 ? (
                  client.accounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 border border-border rounded-md">
                      <div>
                        <div className="text-sm font-medium text-foreground">{account.accountId}</div>
                        <div className="text-xs text-muted-foreground">{account.type} • {account.leverage}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{formatCurrency(account.balance)}</div>
                          <div className="text-xs">{getStatusBadge(account.status)}</div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No trading accounts linked
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-border"></div>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Deposit Total</label>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(client.totalDeposits)}</span>
                </div>
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Withdrawal Total</label>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(client.totalWithdrawals)}</span>
                </div>
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">Net Profit</label>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(client.profit)}</span>
                </div>
              </div>
            </div>

            <div className="border-b border-border"></div>

            {/* Last 5 Activities */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Last 5 Activities</h3>
              <div className="space-y-2">
                {client.activityLog && client.activityLog.length > 0 ? (
                  client.activityLog.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="py-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{activity.action}</div>
                          {activity.details && (
                            <div className="text-xs text-muted-foreground mt-1">{activity.details}</div>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-xs text-muted-foreground">{formatDateTime(activity.date)}</div>
                          <div className="mt-1">
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-card border-t border-border p-6 max-w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="w-full min-w-0 text-destructive border-destructive/20 hover:bg-destructive/10">
                <Ban className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">Ban Client</span>
              </Button>
              <Button variant="outline" size="sm" className="w-full min-w-0">
                <RotateCcw className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">Reset Password</span>
              </Button>
              <Button size="sm" className="w-full min-w-0">
                <Bell className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">Send Notification</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-2xl">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setIsImageModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={selectedImage} 
              alt="Document preview" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}