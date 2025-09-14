import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TransactionsHeader } from "@/components/transactions/TransactionsHeader";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import type { DateRange } from "react-day-picker";

import type { Transaction as ApiTransaction } from "@/features/transactions/transactions.types";
import {
  useGetTransactionsQuery,
  useGetCommissionWithdrawalsQuery,
} from "@/API/transactions.api";

export interface TransactionRecord {
  id: string;
  date: string;
  clientName: string;
  email: string;
  amount: number;
  currency: string;
  type: "deposit" | "withdrawal";
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "rejected";
  avatar?: string;
  processedAt?: string;
  notes?: string;
  proofOfPayment?: string;
  remainingBalance?: number;
  withdrawBalanceType?: string;
  upiId?: string;
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "deposit" | "withdrawal"
  >("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // fetch normal transactions history (server-side)
  const {
    data: fetched,
    isLoading,
    isError,
  } = useGetTransactionsQuery({
    getAllPending: false,
  });

  // fetch commission (now returns ALL commission entries because of Option A)
  const {
    data: commissionFetched,
    isLoading: isLoadingCommissions,
    isError: isErrorCommissions,
  } = useGetCommissionWithdrawalsQuery();

  // small logs so you can verify commission payload arrives
  useEffect(() => {
    if (commissionFetched) {
      console.log("Commission entries (from API) ->", commissionFetched);
    }
  }, [commissionFetched]);

  // normalize fetched data -> ApiTransaction[]
  const apiTransactions: ApiTransaction[] = useMemo(() => {
    if (!fetched) return [];
    if (Array.isArray(fetched)) return fetched as ApiTransaction[];
    const asAny = fetched as any;
    if (Array.isArray(asAny.transactions))
      return asAny.transactions as ApiTransaction[];
    return (asAny as ApiTransaction[]) || [];
  }, [fetched]);

  // commissionFetched is expected now to be an array of Transaction-shaped objects
  const commissionEntries: ApiTransaction[] = useMemo(() => {
    if (!commissionFetched) return [];
    if (Array.isArray(commissionFetched))
      return commissionFetched as ApiTransaction[];
    const asAny = commissionFetched as any;
    if (Array.isArray(asAny.data)) return asAny.data as ApiTransaction[];
    if (Array.isArray(asAny.transactions))
      return asAny.transactions as ApiTransaction[];
    return [];
  }, [commissionFetched]);

  // normalize status strings: PAID|APPROVED => completed, REJECTED => rejected, else pending
  const statusToNormalized = (
    raw?: any
  ): "completed" | "rejected" | "pending" => {
    const sRaw = (raw ?? "").toString();
    const up = sRaw.toUpperCase();
    if (up === "PAID" || up === "APPROVED") return "completed";
    if (up === "REJECTED") return "rejected";
    return "pending";
  };

  // Map normal transactions (only non-pending: APPROVED/REJECTED)
  const transactionRecordsFromTxs: TransactionRecord[] = useMemo(() => {
    if (!apiTransactions || apiTransactions.length === 0) return [];

    return apiTransactions
      .filter((t) => {
        const norm = statusToNormalized(t.transactionStatus);
        return norm === "completed" || norm === "rejected";
      })
      .map((t) => {
        const type =
          (t.transactionType ?? "").toString().toUpperCase() === "DEPOSIT"
            ? "deposit"
            : "withdrawal";
        const s = statusToNormalized(t.transactionStatus);
        const paymentMethod =
          t.mode === "UPI"
            ? "UPI"
            : t.mode === "CRYPTO"
            ? "Crypto"
            : "Bank Transfer";
        const trxId = t.utrNo ?? t.upiId ?? t.cryptoNetwork ?? "" ?? "";

        return {
          id: String(t.id),
          date: (t.createdAt ?? "").split("T")[0],
          clientName: t.name ?? `User ${t.userId ?? t.id}`,
          email: t.email ?? "",
          amount:
            type === "withdrawal"
              ? -Number(t.amount ?? 0)
              : Number(t.amount ?? 0),
          currency: "",
          type,
          paymentMethod,
          transactionId: trxId,
          status: s,
          avatar: undefined,
          processedAt: t.updatedAt ?? undefined,
          notes: t.rejectionReason ?? undefined,
        } as TransactionRecord;
      });
  }, [apiTransactions]);

  // Map commission entries (include PAID and REJECTED; exclude PENDING)
  const transactionRecordsFromCommission: TransactionRecord[] = useMemo(() => {
    if (!commissionEntries || commissionEntries.length === 0) return [];

    return commissionEntries
      .map((c) => {
        const norm = statusToNormalized(
          c.transactionStatus ?? (c as any).status
        );
        // include only non-pending
        if (norm === "pending") return null;

        const clientName = c.name ?? `User ${c.userId ?? c.id}`;
        const email = c.email ?? "";

        const status: "completed" | "rejected" =
          norm === "completed" ? "completed" : "rejected";

        return {
          id: String(c.id),
          date: (c.updatedAt ?? c.paidAt ?? c.createdAt ?? "").split("T")[0],
          clientName,
          email,
          amount: -Number(c.amount ?? 0),
          currency: "",
          type: "withdrawal",
          paymentMethod: "Referral",
          transactionId: String(c.id),
          status,
          avatar: undefined,
          processedAt: c.updatedAt ?? (c as any).paidAt ?? undefined,
          notes:
            (c as any).rejectionReason ?? (c as any).month
              ? `Month: ${(c as any).month}`
              : undefined,
        } as TransactionRecord;
      })
      .filter(Boolean) as TransactionRecord[];
  }, [commissionEntries]);

  // Combined sorted records (most recent first)
  const allRecords: TransactionRecord[] = useMemo(() => {
    const combined = [
      ...transactionRecordsFromTxs,
      ...transactionRecordsFromCommission,
    ];

    combined.sort((a, b) => {
      const da = new Date(a.processedAt ?? a.date).getTime();
      const db = new Date(b.processedAt ?? b.date).getTime();
      return db - da;
    });

    return combined;
  }, [transactionRecordsFromTxs, transactionRecordsFromCommission]);

  useEffect(() => {
    console.log("Final merged records ->", allRecords);
  }, [allRecords]);

  // Filter/search
  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allRecords.filter((r) => {
      const matchesSearch =
        term === "" ||
        r.clientName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (r.transactionId ?? "").toLowerCase().includes(term);

      const pmCode = (r.paymentMethod ?? "").toLowerCase().replace(" ", "-");
      const matchesPaymentFilter =
        activeFilter === "all" || pmCode === activeFilter;

      const matchesTypeFilter = typeFilter === "all" || r.type === typeFilter;

      const matchesDate =
        !dateRange ||
        !dateRange.from ||
        (() => {
          const created = new Date(r.processedAt ?? r.date);
          const from = dateRange.from ? new Date(dateRange.from) : undefined;
          const to = dateRange.to ? new Date(dateRange.to) : undefined;
          if (from && created < new Date(from.setHours(0, 0, 0, 0)))
            return false;
          if (to && created > new Date(to.setHours(23, 59, 59, 999)))
            return false;
          return true;
        })();

      return (
        matchesSearch &&
        matchesPaymentFilter &&
        matchesTypeFilter &&
        matchesDate
      );
    });
  }, [allRecords, searchTerm, activeFilter, typeFilter, dateRange]);

  return (
    <DashboardLayout title="Transaction History">
      <div className="space-y-6">
        <TransactionsHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={(v) =>
            setTypeFilter(v as "all" | "deposit" | "withdrawal")
          }
        />

        <TransactionsTable transactions={filteredTransactions} />
      </div>
    </DashboardLayout>
  );
}
