import { cn } from "@/lib/utils";

interface WithdrawalsFilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filterTabs = [
  { id: "all", label: "All" },
  { id: "referral", label: "Referral" },
  { id: "wallet", label: "Wallet" },
  { id: "bank", label: "Bank" },
  { id: "upi", label: "UPI" },
];

export function WithdrawalsFilterTabs({ activeFilter, onFilterChange }: WithdrawalsFilterTabsProps) {
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