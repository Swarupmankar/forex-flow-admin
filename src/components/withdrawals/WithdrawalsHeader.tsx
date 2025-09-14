import { Search, Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WithdrawalsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkAction: (action: "approve" | "reject") => void;
}

export function WithdrawalsHeader({ 
  searchTerm, 
  onSearchChange, 
  selectedCount,
  onBulkAction 
}: WithdrawalsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium text-primary">
              {selectedCount} selected
            </span>
            <Button
              size="sm"
              onClick={() => onBulkAction("approve")}
              className="h-7 gap-1 bg-success hover:bg-success/90"
            >
              <Check className="h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onBulkAction("reject")}
              className="h-7 gap-1"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or transaction ID"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-[400px]"
          />
        </div>
        
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}