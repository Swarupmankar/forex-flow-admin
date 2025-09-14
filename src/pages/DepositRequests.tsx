import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DepositRequestsHeader } from "@/components/deposits/DepositRequestsHeader";
import { DepositRequestsTable } from "@/components/deposits/DepositRequestsTable";
import { DepositApprovalModal } from "@/components/deposits/DepositApprovalModal";
import type { DateRange } from "react-day-picker";
import { Transaction } from "@/features/transactions/transactions.types";
import {
  useApproveTransactionMutation,
  useGetTransactionsQuery,
  useRejectTransactionMutation,
} from "@/API/transactions.api";

export interface DepositRequest {
  id: string;
  date: string;
  clientName: string;
  email: string;
  amount: number;
  paymentMethod: "upi" | "bank" | "crypto";
  status: "pending" | "approved" | "rejected";
  paymentProof?: string;
  paymentDetails: {
    utr?: string;
    transactionId?: string;
    cryptoNetwork: string;
    hashId?: string;
    payerName?: string;
    bankName?: string;
    walletAddress?: string;
    upiId?: string;
    utrNo?: string;
  };
  submittedAt: string;
  avatar?: string;
  rejectionReason?: string | null;
}

function mapTransactionToDepositRequest(t: Transaction): DepositRequest {
  const paymentMethod =
    t.mode === "UPI" ? "upi" : t.mode === "CRYPTO" ? "crypto" : "bank";

  const status =
    t.transactionStatus === "PENDING"
      ? "pending"
      : t.transactionStatus === "APPROVED"
      ? "approved"
      : "rejected";

  const possibleTxHash =
    (t as any).txHash ?? (t as any).transactionHash ?? null;

  return {
    id: String(t.id),
    date: t.createdAt?.split("T")[0] ?? "",
    clientName: t.name ?? `User ${t.userId ?? t.id}`,
    email: t.email ?? "",
    amount: Number(t.amount ?? 0),
    paymentMethod,
    status,
    paymentProof: t.depositProof ?? null,
    paymentDetails: {
      utrNo: t.utrNo ?? null,
      transactionId: t.utrNo ?? null,
      cryptoNetwork: t.cryptoNetwork ?? "",
      hashId: t.utrNo ?? null,
      payerName: t.name ?? `User ${t.userId ?? t.id}`,
    },
    submittedAt: t.createdAt ?? null,
    avatar: undefined,
    rejectionReason: t.rejectionReason ?? null,
  };
}

export default function DepositRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(
    null
  );

  // Fetch from backend: only pending items server-side (we will filter deposits client-side)
  const {
    data: rawTransactions,
    isLoading,
    isError,
  } = useGetTransactionsQuery({ getAllPending: true });

  const [approveMutation, { isLoading: isApproving }] =
    useApproveTransactionMutation();
  const [rejectMutation, { isLoading: isRejecting }] =
    useRejectTransactionMutation();

  // Map + keep only DEPOSIT transactions
  const depositRequests: DepositRequest[] = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions
      .filter((t) => t.transactionType === "DEPOSIT")
      .map(mapTransactionToDepositRequest);
  }, [rawTransactions]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return depositRequests.filter((request) => {
      const matchesSearch =
        term === "" ||
        request.clientName.toLowerCase().includes(term) ||
        (request.email ?? "").toLowerCase().includes(term) ||
        request.id.toLowerCase().includes(term);

      const matchesFilter =
        activeFilter === "all" || request.status === activeFilter;

      // Optionally add dateRange filtering here if you want
      return matchesSearch && matchesFilter;
    });
  }, [depositRequests, searchTerm, activeFilter, dateRange]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveMutation({ transactionId: Number(requestId) }).unwrap();
      setSelectedRequest(null);
      // RTK Query invalidates tags so list will refresh automatically
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  const handleReject = async (requestId: string, rejectionReason: string) => {
    try {
      const res = await rejectMutation({
        transactionId: Number(requestId),
        rejectionReason,
      }).unwrap();
      setSelectedRequest(null);
    } catch (err: any) {
      console.error("Reject failed", err);
      // if backend returns a message, try to show it
      const message =
        err?.data?.message || err?.message || "Failed to reject deposit";
      // show a user-visible message (replace with your toast if you have one)
      alert(`Reject failed: ${message}`);
    }
  };

  return (
    <DashboardLayout title="Deposit Requests">
      <div className="space-y-6">
        <DepositRequestsHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <DepositRequestsTable
          requests={filteredRequests}
          onViewDetails={setSelectedRequest}
        />

        {selectedRequest && (
          <DepositApprovalModal
            request={selectedRequest}
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
