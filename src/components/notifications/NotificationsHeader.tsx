import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NotificationsHeaderProps {
  onCreateClick: () => void;
  onExport?: (format: "csv" | "pdf") => void;
}

export function NotificationsHeader({ onCreateClick, onExport }: NotificationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications & Broadcasts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage announcements for your clients
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
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
        
        <Button onClick={onCreateClick} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>
    </div>
  );
}