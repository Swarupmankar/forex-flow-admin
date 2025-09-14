import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { WithdrawalsHeader } from "@/components/withdrawals/WithdrawalsHeader";
import { WithdrawalsFilterTabs } from "@/components/withdrawals/WithdrawalsFilterTabs";
import { WithdrawalsTable } from "@/components/withdrawals/WithdrawalsTable";
import { WithdrawalDetailDrawer } from "@/components/withdrawals/WithdrawalDetailDrawer";

import type { DateRange } from "react-day-picker";
import type { Transaction as ApiTransaction } from "@/features/transactions/transactions.types";
import {
  useGetTransactionsQuery,
  useApproveTransactionMutation,
  useRejectTransactionMutation,
  useGetCommissionWithdrawalsQuery,
  useUpdateCommissionRequestMutation,
} from "@/API/transactions.api";

export interface WithdrawalRequest {
  id: string;
  clientName: string;
  email: string;
  amount: number;
  type: "referral" | "wallet" | "bank" | "upi";
  destination: string;
  destinationType: "bank" | "upi" | "crypto" | "wallet";
  submissionDate: string;
  status: "pending" | "approved" | "rejected";
  avatar?: string;
  clientRegistrationDate?: string;
  clientBalance: number;
  withdrawalReason?: string;
  paymentMethodDetails: {
    // UPI specific
    upiId?: string;
    beneficiaryName?: string;
    // Bank specific
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
    // Crypto specific
    walletAddress?: string;
    networkType?: string | null;
    networkFee?: number;
  };
  // New UI fields surfaced from backend
  remainingBalance?: number | null;
  balanceType?: string | null;
  accountIdentifier?: string | null;
  rejectionReason?: string | null;
}

/** Map backend Transaction -> WithdrawalRequest UI */
function mapTransactionToWithdrawal(t: ApiTransaction): WithdrawalRequest {
  const destType =
    (t.mode ?? "BANK").toString().toUpperCase() === "UPI"
      ? "upi"
      : (t.mode ?? "BANK").toString().toUpperCase() === "CRYPTO"
      ? "crypto"
      : "bank";

  // detect commission rows -> force type = referral
  const isCommission =
    typeof t.accountIdentifier === "string" &&
    t.accountIdentifier.toUpperCase().startsWith("COMMISSION");

  const uiType: WithdrawalRequest["type"] = isCommission
    ? "referral"
    : destType === "upi"
    ? "upi"
    : destType === "crypto"
    ? "wallet"
    : "bank";

  const status: WithdrawalRequest["status"] =
    (t.transactionStatus ?? "").toString().toUpperCase() === "PENDING"
      ? "pending"
      : (t.transactionStatus ?? "").toString().toUpperCase() === "PAID" ||
        (t.transactionStatus ?? "").toString().toUpperCase() === "APPROVED"
      ? "approved"
      : "rejected";

  const destination =
    t.bankAccountNo ??
    t.upiId ??
    t.cryptoAddress ??
    String(t.toAccountId ?? t.fromAccountId ?? t.userId ?? t.id ?? "");

  // Remaining balance is string in backend - parse to number if present
  let remainingBalanceNum: number | null = null;
  if (
    typeof t.remainingBalance === "string" &&
    t.remainingBalance.trim() !== ""
  ) {
    const parsed = Number(t.remainingBalance);
    remainingBalanceNum = Number.isFinite(parsed) ? parsed : null;
  } else if (typeof t.remainingBalance === "number") {
    remainingBalanceNum = t.remainingBalance;
  }

  return {
    id: String(t.id),
    clientName: (t.name ??
      (t as any).userName ??
      `User ${t.userId ?? t.id}`) as string,
    email: (t as any).userEmail ?? (t as any).email ?? "",
    amount: Number(t.amount ?? 0),
    type: uiType, // <-- will be "referral" for commission rows (if accountIdentifier present)
    destination,
    destinationType: destType as WithdrawalRequest["destinationType"],
    submissionDate: t.createdAt ?? "",
    status,
    avatar: undefined,
    clientRegistrationDate: undefined,
    clientBalance: undefined,
    withdrawalReason: isCommission ? "Commission payout" : undefined,
    paymentMethodDetails: {
      upiId: t.upiId ?? null,
      beneficiaryName: t.name ?? null,
      accountNumber: t.bankAccountNo ?? null,
      ifscCode: t.bankIfsc ?? null,
      bankName: t.bankName ?? null,
      accountHolderName: t.name ?? null,
      walletAddress: t.cryptoAddress ?? null,
      networkType: t.cryptoNetwork ?? null,
      networkFee: null,
    },
    remainingBalance: remainingBalanceNum,
    rejectionReason: t.rejectionReason ?? null,
    balanceType: t.balanceType ?? null,
    accountIdentifier: t.accountIdentifier ?? null,
  };
}

export default function Withdrawals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch pending transactions from server (this returns all pending if getAllPending: true)
  const { data: fetched, isLoading } = useGetTransactionsQuery({
    getAllPending: true,
  });

  // Fetch commission withdraw requests (all statuses). We'll only use PENDING here.
  const { data: commissionAllData = [], isLoading: isLoadingCommissions } =
    useGetCommissionWithdrawalsQuery();

  // Commission update mutation (approve/reject referral)
  const [updateCommissionRequest, { isLoading: isUpdatingCommission }] =
    useUpdateCommissionRequestMutation();

  // Approve / reject mutations for normal transactions
  const [approveMutation, { isLoading: isApproving }] =
    useApproveTransactionMutation();
  const [rejectMutation, { isLoading: isRejecting }] =
    useRejectTransactionMutation();

  // ----- Only keep commission entries that are PENDING (exclude PAID & REJECTED) -----
  const commissionPending: ApiTransaction[] = useMemo(() => {
    if (!commissionAllData || !Array.isArray(commissionAllData)) return [];
    return (commissionAllData as ApiTransaction[]).filter(
      (c) =>
        (c.transactionStatus ?? c.status ?? "").toString().toUpperCase() ===
        "PENDING"
    );
  }, [commissionAllData]);

  // normalize fetched -> ApiTransaction[] and merge commissionPending
  const apiTxs: ApiTransaction[] = useMemo(() => {
    // normalize existing fetched (supports either array or { transactions: [] } shape)
    const txsFromFetched: ApiTransaction[] = (() => {
      if (!fetched) return [];
      if (Array.isArray(fetched)) return fetched as ApiTransaction[];
      const asAny = fetched as any;
      if (Array.isArray(asAny.transactions))
        return asAny.transactions as ApiTransaction[];
      return (asAny as ApiTransaction[]) || [];
    })();

    // commissionPending is already Transaction[] shaped by the API transform
    const txsFromCommission: ApiTransaction[] = commissionPending
      ? (commissionPending as ApiTransaction[])
      : [];

    // combine and dedupe by id (preserve order: fetched then commissions)
    const combined = [...txsFromFetched, ...txsFromCommission];
    const seen = new Set<number>();
    const deduped: ApiTransaction[] = [];
    for (const t of combined) {
      const idNum = typeof t?.id === "number" ? t.id : Number(t?.id);
      if (!Number.isFinite(idNum)) {
        // fallback: if id is not numeric, still push once
        if (!deduped.includes(t)) deduped.push(t);
        continue;
      }
      if (!seen.has(idNum)) {
        seen.add(idNum);
        deduped.push(t);
      }
    }
    return deduped;
  }, [fetched, commissionPending]);

  // keep only withdraw transactions & map to UI shape
  const withdrawals = useMemo(() => {
    return apiTxs
      .filter(
        (t) => (t.transactionType ?? "").toString().toUpperCase() === "WITHDRAW"
      )
      .map(mapTransactionToWithdrawal);
  }, [apiTxs]);

  // Apply search, tab and date filters
  const filteredWithdrawals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return withdrawals.filter((w) => {
      const matchesSearch =
        term === "" ||
        (w.clientName ?? "").toLowerCase().includes(term) ||
        (w.email ?? "").toLowerCase().includes(term) ||
        (w.id ?? "").toLowerCase().includes(term) ||
        ((w.accountIdentifier ?? "") as string).toLowerCase().includes(term) ||
        (w.destination ?? "").toLowerCase().includes(term);

      const matchesFilter = activeFilter === "all" || w.type === activeFilter;

      const matchesDate =
        !dateRange ||
        !dateRange.from ||
        (() => {
          const created = new Date(w.submissionDate);
          const from = dateRange.from ? new Date(dateRange.from) : undefined;
          const to = dateRange.to ? new Date(dateRange.to) : undefined;
          if (from && created < new Date(from.setHours(0, 0, 0, 0)))
            return false;
          if (to && created > new Date(to.setHours(23, 59, 59, 999)))
            return false;
          return true;
        })();

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [withdrawals, searchTerm, activeFilter, dateRange]);

  /**
   * Approve a single id. Detect commission rows by checking commissionPending presence.
   * If referral/commission -> call updateCommissionRequest. Else call approveMutation.
   */
  async function approveById(id: string) {
    try {
      // find transaction in the normalized list (apiTxs)
      const tx = apiTxs.find((t) => String(t.id) === String(id));

      // RELIABLE commission detection: does this id appear in commissionPending fetched from commission route?
      const isCommission = commissionPending.some(
        (c) => String(c.id) === String(id)
      );

      if (isCommission) {
        // commission API requires userId and commissionWithdrawRequestId
        const commEntry = commissionPending.find(
          (c) => String(c.id) === String(id)
        );
        const userId =
          (tx && (tx.userId ?? (tx as any).userId)) ??
          (commEntry && (commEntry.userId ?? (commEntry as any).user?.id)) ??
          undefined;

        if (userId == null) {
          throw new Error("Commission transaction missing userId");
        }

        const payload = {
          userId: Number(userId),
          commissionWithdrawRequestId: Number(id),
          action: "PAID" as const,
        };
        const res = await updateCommissionRequest(payload).unwrap();
        return res;
      } else {
        // normal transaction flow (existing)
        const res = await (approveMutation as any)({
          transactionId: Number(id),
        }).unwrap();
        return res;
      }
    } catch (err) {
      console.error("approveById failed:", err);
      throw err;
    }
  }

  /**
   * Reject a single id. For commission rows call updateCommissionRequest with action REJECTED and rejectionMessage.
   * For normal transactions call existing rejectMutation.
   */
  async function rejectById(id: string, reason?: string) {
    try {
      const trimmed = (reason ?? "").toString().trim();

      // guard: do not call backend with empty rejectionReason
      if (!trimmed) {
        console.warn("Not calling reject mutation: rejectionReason is empty", {
          id,
          reason,
        });
        throw new Error("rejectionReason is required (client-side)");
      }

      // detect commission by commissionPending presence
      const isCommission = commissionPending.some(
        (c) => String(c.id) === String(id)
      );

      if (isCommission) {
        const commEntry = commissionPending.find(
          (c) => String(c.id) === String(id)
        );
        const userId =
          (commEntry && (commEntry.userId ?? (commEntry as any).user?.id)) ??
          undefined;
        if (userId == null) {
          // fallback: try to find in merged apiTxs
          const tx = apiTxs.find((t) => String(t.id) === String(id));
          if (!tx || (tx.userId ?? (tx as any).userId) == null) {
            throw new Error("Commission transaction missing userId");
          }
        }

        const payload = {
          userId: Number(userId),
          commissionWithdrawRequestId: Number(id),
          action: "REJECTED" as const,
          rejectionMessage: trimmed,
        };
        const res = await updateCommissionRequest(payload).unwrap();
        return res;
      } else {
        // Normal transaction rejection uses existing endpoint
        const payload = { transactionId: Number(id), rejectionReason: trimmed };
        console.log("Calling rejectMutation with payload ->", payload);

        const res = await (rejectMutation as any)(payload).unwrap();
        console.log("Reject response ->", res);

        return res as {
          rejectionReason?: string;
          transactionId?: number;
          status?: string;
        };
      }
    } catch (err: any) {
      console.error(
        "Reject mutation failed:",
        err?.data ?? err?.message ?? err
      );
      throw err;
    }
  }

  // Single approve handler wired to UI
  const handleApprove = async (id: string) => {
    try {
      await approveById(id);
      setSelectedWithdrawal(null);
      setSelectedWithdrawals((prev) => prev.filter((x) => x !== id));
    } catch {}
  };

  // Single reject handler wired to UI
  const handleReject = async (id: string, reason?: string) => {
    try {
      const res = await rejectById(id, reason);
      setSelectedWithdrawal((prev) =>
        prev
          ? {
              ...prev,
              status: "rejected",
              rejectionReason:
                (res && (res as any).rejectionReason) ??
                reason ??
                prev.rejectionReason,
            }
          : null
      );

      setSelectedWithdrawals((prev) => prev.filter((x) => x !== id));
    } catch {}
  };

  // Bulk approve selected (parallel) - approves commissions and normal txs
  const handleBulkApprove = async () => {
    if (!selectedWithdrawals.length) return;
    try {
      await Promise.all(selectedWithdrawals.map((id) => approveById(id)));
      setSelectedWithdrawals([]);
      setSelectedWithdrawal(null);
    } catch (err) {
      console.error("Bulk approve failed", err);
    }
  };

  const handleTableStatusUpdate = (
    id: string,
    status: "approved" | "pending"
  ) => {
    if (status === "approved") {
      void handleApprove(id);
    } else if (status === "pending") {
      console.warn("Setting back to pending not implemented on server.");
    }
  };

  return (
    <DashboardLayout title="Withdrawals">
      <div className="space-y-6">
        <WithdrawalsHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCount={selectedWithdrawals.length}
          onBulkAction={handleBulkApprove}
        />

        <WithdrawalsFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <WithdrawalsTable
          withdrawals={filteredWithdrawals}
          selectedWithdrawals={selectedWithdrawals}
          onSelectionChange={setSelectedWithdrawals}
          onViewWithdrawal={(w) => setSelectedWithdrawal(w)}
          onStatusUpdate={handleTableStatusUpdate}
        />

        <WithdrawalDetailDrawer
          request={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onStatusUpdate={(id, status, notes) => {
            if (status === "approved") handleApprove(id);
            else if (status === "rejected") handleReject(id, notes);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
