import { Search, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SpreadProfilesHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateProfile: () => void;
  onExport?: (format: "csv" | "pdf") => void;
}

export function SpreadProfilesHeader({ 
  searchTerm, 
  onSearchChange,
  onCreateProfile,
  onExport
}: SpreadProfilesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Spread Profiles</h1>
        <p className="text-muted-foreground">
          Manage spread configurations for different currency pairs and account types
        </p>
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full sm:w-[300px]"
          />
        </div>
        
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
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
        
        <Button onClick={onCreateProfile} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Profile
        </Button>
      </div>
    </div>
  );
}