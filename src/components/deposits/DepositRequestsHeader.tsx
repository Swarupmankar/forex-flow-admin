import { Search, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useGetTransactionsQuery } from "@/API/transactions.api";
import type { Transaction } from "@/features/transactions/transactions.types";

export type DepositFilter = "pending" | "approved" | "rejected" | "all";

interface DepositRequestsHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  activeFilter: DepositFilter;
  onFilterChange: (filter: DepositFilter) => void;
  counts?: {
    pending?: number;
    approved?: number;
    rejected?: number;
    all?: number;
  };
}

const DEFAULT_POLLING_INTERVAL = 10_000;

export function DepositRequestsHeader({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  activeFilter,
  onFilterChange,
  counts: overrideCounts,
}: DepositRequestsHeaderProps) {
  const { data: fetchedData } = useGetTransactionsQuery(
    { getAllPending: false },
    { pollingInterval: DEFAULT_POLLING_INTERVAL }
  );

 
  const transactions: Transaction[] = (() => {
    if (!fetchedData) return [];
    // backend might return an array or an object with `transactions` key
    if (Array.isArray(fetchedData)) return fetchedData;
    // @ts-ignore defensive: if shape is { transactions: Transaction[] }
    if (fetchedData.transactions && Array.isArray(fetchedData.transactions))
      // @ts-ignore
      return fetchedData.transactions;
    // otherwise try to treat as array anyway (defensive)
    return (fetchedData as unknown as Transaction[]) || [];
  })();

  const computedCounts = (() => {
    if (overrideCounts) {
      return {
        pending: overrideCounts.pending ?? 0,
        approved: overrideCounts.approved ?? 0,
        rejected: overrideCounts.rejected ?? 0,
        all: overrideCounts.all ?? 0,
      };
    }

    const all = transactions.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const t of transactions) {
      if (!t || !t.transactionStatus) continue;
      const s = t.transactionStatus.toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "APPROVED") approved++;
      else if (s === "REJECTED") rejected++;
    }

    return { pending, approved, rejected, all };
  })();

  const statusFilters: { id: DepositFilter; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: computedCounts.pending },
    // { id: "approved", label: "Approved", count: computedCounts.approved },
    // { id: "rejected", label: "Rejected", count: computedCounts.rejected },
    // { id: "all", label: "All", count: computedCounts.all },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Deposit Requests
          </h1>
          <p className="text-muted-foreground">
            Review and approve customer deposit requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by client name, email, or request ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[200px]",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Status Filter Tabs */}
      <div className="bg-muted/30 rounded-lg p-1">
        <div className="flex items-center gap-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeFilter === filter.id
                  ? "bg-card text-foreground shadow-sm border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              {filter.label}
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
