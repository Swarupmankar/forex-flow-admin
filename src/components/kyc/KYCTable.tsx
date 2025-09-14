import { Eye, Check, X, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KYCRequest } from "@/pages/KYC";

interface KYCTableProps {
  requests: KYCRequest[];
  selectedRequests: string[];
  onSelectRequest: (requestId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewRequest: (request: KYCRequest) => void;
  onStatusUpdate: (requestId: string, status: "pending" | "approved" | "rejected") => void;
}

export function KYCTable({
  requests,
  selectedRequests,
  onSelectRequest,
  onSelectAll,
  onViewRequest,
  onStatusUpdate
}: KYCTableProps) {
  const allSelected = requests.length > 0 && selectedRequests.length === requests.length;
  const someSelected = selectedRequests.length > 0 && selectedRequests.length < requests.length;

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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="text-left p-4 w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </th>
              <th className="text-left p-4 font-semibold text-foreground">Client Name</th>
              <th className="text-left p-4 font-semibold text-foreground">Email</th>
              <th className="text-left p-4 font-semibold text-foreground">Submission Date</th>
              <th className="text-left p-4 font-semibold text-foreground">Document Type</th>
              <th className="text-left p-4 font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-semibold text-foreground w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr 
                key={request.id} 
                className="border-b hover:bg-muted/20 transition-colors group"
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onCheckedChange={() => onSelectRequest(request.id)}
                  />
                </td>
                
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {request.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{request.clientName}</span>
                  </div>
                </td>
                
                <td className="p-4">
                  <span className="text-muted-foreground">{request.email}</span>
                </td>
                
                <td className="p-4">
                  <span className="text-muted-foreground">{formatDate(request.submissionDate)}</span>
                </td>
                
                <td className="p-4">
                  <span className="font-medium text-foreground">{request.documentType}</span>
                </td>
                
                <td className="p-4">
                  {getStatusBadge(request.status)}
                </td>
                
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewRequest(request)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {request.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusUpdate(request.id, "approved")}
                          className="h-8 w-8 p-0 hover:bg-success/10 text-success"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusUpdate(request.id, "rejected")}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => onViewRequest(request)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {request.status !== "approved" && (
                          <DropdownMenuItem 
                            onClick={() => onStatusUpdate(request.id, "approved")}
                            className="flex items-center gap-2 text-success"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {request.status !== "rejected" && (
                          <DropdownMenuItem 
                            onClick={() => onStatusUpdate(request.id, "rejected")}
                            className="flex items-center gap-2 text-destructive"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {requests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No KYC requests found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}