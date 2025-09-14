import { cn } from "@/lib/utils";

interface DepositsFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filterTabs = [
  { id: "all", label: "All" },
  { id: "bank-transfer", label: "Bank Transfer" },
  { id: "upi", label: "UPI" },
  { id: "crypto", label: "Crypto" },
];

export function DepositsFilterTabs({ activeFilter, onFilterChange }: DepositsFilterTabsProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-1">
      <div className="flex items-center gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              activeFilter === tab.id
                ? "bg-card text-foreground shadow-sm border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}