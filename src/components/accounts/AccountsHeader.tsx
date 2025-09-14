import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccountsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function AccountsHeader({ searchTerm, onSearchChange }: AccountsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">Accounts & Spreads Management</h1>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by account ID or client name"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
        
        <Button size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Account
        </Button>
      </div>
    </div>
  );
}