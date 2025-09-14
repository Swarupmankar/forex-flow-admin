import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  onAddAdminClick: () => void;
}

export function SettingsHeader({ onAddAdminClick }: SettingsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings & Admin Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage administrators and configure system settings
        </p>
      </div>
      
      <Button onClick={onAddAdminClick} className="w-full sm:w-auto">
        <UserPlus className="h-4 w-4 mr-2" />
        Add New Admin
      </Button>
    </div>
  );
}