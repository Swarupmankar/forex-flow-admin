import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToPDF, generateExportFilename, formatCurrencyForExport, formatDateForExport, formatStatusForExport } from "@/lib/export-utils";

interface RecentActivityExportProps {
  activities: any[];
}

export function RecentActivityExport({ activities }: RecentActivityExportProps) {
  const handleExport = (format: "csv" | "pdf") => {
    const headers = ["Time", "Client", "Activity", "Amount", "Status"];
    const rows = activities.map(activity => [
      formatDateForExport(activity.timestamp),
      activity.client,
      activity.activity,
      activity.amount ? formatCurrencyForExport(activity.amount) : "N/A",
      formatStatusForExport(activity.status)
    ]);

    const exportData = {
      headers,
      rows,
      filename: generateExportFilename("recent_activity")
    };

    if (format === "csv") {
      exportToCSV(exportData);
    } else {
      exportToPDF(exportData);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}