import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { KYCRequest } from "@/pages/KYC";

interface KYCFilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  requests: KYCRequest[];
  selectedCount: number;
  onBulkAction: (action: "approve" | "reject") => void;
}

export function KYCFilterTabs({ 
  activeTab, 
  onTabChange, 
  requests, 
  selectedCount, 
  onBulkAction 
}: KYCFilterTabsProps) {
  const tabs = [
    { id: "all", label: "All", count: requests.length },
    { id: "pending", label: "Pending", count: requests.filter(r => r.status === "pending").length },
    { id: "approved", label: "Approved", count: requests.filter(r => r.status === "approved").length },
    { id: "rejected", label: "Rejected", count: requests.filter(r => r.status === "rejected").length }
  ];

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {tab.label}
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  activeTab === tab.id ? "bg-primary/10 text-primary" : ""
                }`}
              >
                {tab.count}
              </Badge>
            </button>
          ))}
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
                className="flex items-center gap-1 text-success border-success/20 hover:bg-success/10"
              >
                <Check className="h-3 w-3" />
                Bulk Approve
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onBulkAction('reject')}
                className="flex items-center gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
                Bulk Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}