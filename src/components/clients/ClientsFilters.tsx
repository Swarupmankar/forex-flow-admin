import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Mail, Ban } from "lucide-react";

interface ClientsFiltersProps {
  filters: {
    kycStatus: string;
    registrationDate: string;
    accountType: string;
  };
  onFiltersChange: (filters: any) => void;
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

export function ClientsFilters({ 
  filters, 
  onFiltersChange, 
  selectedCount, 
  onBulkAction 
}: ClientsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card rounded-lg border p-4 shadow-sm">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">Filters:</span>
        
        <Select 
          value={filters.kycStatus} 
          onValueChange={(value) => onFiltersChange({ ...filters, kycStatus: value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.registrationDate} 
          onValueChange={(value) => onFiltersChange({ ...filters, registrationDate: value })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Registration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.accountType} 
          onValueChange={(value) => onFiltersChange({ ...filters, accountType: value })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Account Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} selected
          </Badge>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('approve')}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Approve KYC
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('notify')}
              className="flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              Send Notification
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onBulkAction('ban')}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Ban className="h-3 w-3" />
              Ban Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}