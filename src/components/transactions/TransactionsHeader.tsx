import { Search, Calendar, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

interface TransactionsHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
}

const paymentMethodFilters = [
  { id: "all", label: "All Methods" },
  { id: "bank-transfer", label: "Bank Transfer" },
  { id: "upi", label: "UPI" },
  { id: "crypto", label: "Crypto" },
];

const typeFilters = [
  { id: "all", label: "All Types" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
];

export function TransactionsHeader({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  activeFilter,
  onFilterChange,
  typeFilter,
  onTypeFilterChange
}: TransactionsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">Complete history of deposits and withdrawals</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
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
              placeholder="Search by client name, email, or transaction ID..."
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

      {/* Filter Tabs */}
      <div className="space-y-3">
        {/* Transaction Type Filter */}
        <div className="bg-muted/30 rounded-lg p-1">
          <div className="flex items-center gap-1">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onTypeFilterChange(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  typeFilter === filter.id
                    ? "bg-card text-foreground shadow-sm border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Filter */}
        <div className="bg-muted/30 rounded-lg p-1">
          <div className="flex items-center gap-1">
            {paymentMethodFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeFilter === filter.id
                    ? "bg-card text-foreground shadow-sm border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}