import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="bg-muted/30 p-1 rounded-lg">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3 bg-transparent gap-1">
          <TabsTrigger 
            value="admin-management"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Admin Management
          </TabsTrigger>
          <TabsTrigger 
            value="system-settings"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            System Settings
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Security
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}