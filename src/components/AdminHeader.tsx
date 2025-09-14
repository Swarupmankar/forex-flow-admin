import { Search, Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-card border-b border-border shadow-sm z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="p-2.5 hover:bg-muted rounded-lg transition-colors">
            <Search className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2.5 hover:bg-muted rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground border-2 border-card">
              3
            </Badge>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}