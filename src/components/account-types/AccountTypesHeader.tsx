import { Search, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AccountTypesHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateNew: () => void;
  onExport?: (format: "csv" | "pdf") => void;
}

export function AccountTypesHeader({
  searchTerm,
  onSearchChange,
  onCreateNew,
  onExport
}: AccountTypesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Types Management</h1>
        <p className="text-muted-foreground">Create and manage different trading account types</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search account types..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full sm:w-80"
          />
        </div>
        
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Button onClick={onCreateNew} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Create New Account Type
        </Button>
      </div>
    </div>
  );
}