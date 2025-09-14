import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KYCHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function KYCHeader({ searchQuery, onSearchChange }: KYCHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card rounded-lg border p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-foreground">KYC Requests</h1>
        <p className="text-muted-foreground mt-1">Review and manage client verification documents</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Button variant="outline" size="default" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        
        <Button variant="outline" size="default" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}