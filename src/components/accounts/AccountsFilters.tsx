import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccountsFiltersProps {
  accountTypeFilter: string;
  statusFilter: string;
  sortBy: string;
  onAccountTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function AccountsFilters({
  accountTypeFilter,
  statusFilter,
  sortBy,
  onAccountTypeChange,
  onStatusChange,
  onSortChange,
}: AccountsFiltersProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Account Type:</span>
          <Select value={accountTypeFilter} onValueChange={onAccountTypeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
              <SelectItem value="Raw Spread">Raw Spread</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Sort By:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Newest">Newest</SelectItem>
              <SelectItem value="Oldest">Oldest</SelectItem>
              <SelectItem value="Balance High–Low">Balance High–Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}