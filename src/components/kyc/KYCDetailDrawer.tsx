import React, { useState } from "react";
import { X, Phone, Calendar, FileText, Eye, Check, XIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KYCRequest } from "@/pages/KYC";

interface KYCDetailDrawerProps {
  request: KYCRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (requestId: string, status: "pending" | "approved" | "rejected", notes?: string) => void;
}

export function KYCDetailDrawer({ request, isOpen, onClose, onStatusUpdate }: KYCDetailDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Set initial values when request changes - MOVED BEFORE EARLY RETURN
  React.useEffect(() => {
    if (request) {
      setSelectedStatus(request.status);
      setAdminNotes(request.adminNotes);
    }
  }, [request]);

  if (!request) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Approved</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveChanges = () => {
    onStatusUpdate(request.id, selectedStatus as "pending" | "approved" | "rejected", adminNotes);
  };

  const handleQuickAction = (status: "approved" | "rejected") => {
    setSelectedStatus(status);
    onStatusUpdate(request.id, status, adminNotes);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {request.clientName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{request.clientName}</div>
                  <div className="text-sm text-muted-foreground">KYC Review</div>
                </div>
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm text-foreground">{request.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {request.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(request.registrationDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submission Date</label>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(request.submissionDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submitted Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {request.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedDocument(doc.url)}
                    >
                      <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{doc.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(doc.uploaded)}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc.url);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Status Update
                  {getStatusBadge(request.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Review Comments</Label>
                  <Textarea
                    id="notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add your review notes here..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              <Button 
                onClick={handleSaveChanges}
                className="w-full"
                disabled={selectedStatus === request.status && adminNotes === request.adminNotes}
              >
                Save Changes
              </Button>
              
              {request.status === "pending" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleQuickAction("approved")}
                    className="flex items-center gap-2 bg-success hover:bg-success/90"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  
                  <Button 
                    onClick={() => handleQuickAction("rejected")}
                    variant="destructive" 
                    className="flex items-center gap-2"
                  >
                    <XIcon className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Document Preview Dialog */}
      <Dialog open={selectedDocument !== null} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            <div className="bg-muted rounded-lg aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Document preview would appear here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  In a real implementation, this would show the actual document image
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
