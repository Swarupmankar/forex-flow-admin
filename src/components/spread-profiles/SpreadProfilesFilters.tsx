import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpreadProfilesFiltersProps {
  typeFilter: string;
  statusFilter: string;
  sortBy: string;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export function SpreadProfilesFilters({
  typeFilter,
  statusFilter,
  sortBy,
  onTypeChange,
  onStatusChange,
  onSortChange,
}: SpreadProfilesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Newest">Newest First</SelectItem>
          <SelectItem value="Oldest">Oldest First</SelectItem>
          <SelectItem value="Name A-Z">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
