import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DepositApprovalModal } from "@/components/deposits/DepositApprovalModal";
import { FundingToolbar } from "@/components/transactions/FundingToolbar";
import { FundingTable } from "@/components/transactions/FundingTable";
import { FundingStats } from "@/components/transactions/FundingStats";
import { CryptoTxDialog } from "@/components/transactions/CryptoTxDialog";
import type {
  CryptoTransaction,
  Transaction,
} from "@/features/transactions/transactions.types";
import {
  DEFAULT_FUNDING_FILTERS,
  applyFundingFilters,
  fromCrypto,
  fromManual,
  type FundingFilters,
  type FundingRow,
} from "@/features/transactions/funding";
import { toNum } from "@/components/transactions/FxAmount";
import {
  useApproveTransactionMutation,
  useGetCryptoTransactionsQuery,
  useGetTransactionsQuery,
  useRejectTransactionMutation,
} from "@/API/transactions.api";
import { toast } from "sonner";

export interface DepositRequest {
  id: string;
  date: string;
  clientName: string;
  email: string;
  amount: number;
  inrAmount: number | null;
  fxRate: number | null;
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

  return {
    id: String(t.id),
    date: t.createdAt?.split("T")[0] ?? "",
    clientName: t.name ?? `User ${t.userId ?? t.id}`,
    email: t.email ?? "",
    amount: Number(t.amount ?? 0),
    inrAmount: toNum(t.inrAmount),
    fxRate: toNum(t.fxRate),
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
  const [filters, setFilters] = useState<FundingFilters>(DEFAULT_FUNDING_FILTERS);
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoTransaction | null>(null);

  // The queue only: what is still pending. Settled deposits are on Transaction History.
  const pendingQ = useGetTransactionsQuery({ getAllPending: true });
  const cryptoQ = useGetCryptoTransactionsQuery({ action: "DEPOSIT" });

  const [approveMutation] = useApproveTransactionMutation();
  const [rejectMutation] = useRejectTransactionMutation();

  const rows: FundingRow[] = useMemo(() => {
    const manual = (pendingQ.data ?? [])
      .filter((t) => t.transactionType === "DEPOSIT")
      .map(fromManual);
    const crypto = (cryptoQ.data ?? []).map(fromCrypto);
    return [...manual, ...crypto].filter((r) => r.status === "pending");
  }, [pendingQ.data, cryptoQ.data]);

  const visible = useMemo(() => applyFundingFilters(rows, filters), [rows, filters]);

  const open = (row: FundingRow) => {
    if (row.crypto) setSelectedCrypto(row.crypto);
    else if (row.manual) setSelectedRequest(mapTransactionToDepositRequest(row.manual));
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveMutation({ transactionId: Number(requestId) }).unwrap();
      toast.success("Deposit approved");
      setSelectedRequest(null);
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || "Failed to approve deposit");
    }
  };

  const handleReject = async (requestId: string, rejectionReason: string) => {
    try {
      await rejectMutation({ transactionId: Number(requestId), rejectionReason }).unwrap();
      toast.success("Deposit rejected");
      setSelectedRequest(null);
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message || "Failed to reject deposit");
    }
  };

  const loading = pendingQ.isLoading || cryptoQ.isLoading;

  return (
    <DashboardLayout title="Deposit Requests">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
          <p className="text-sm text-muted-foreground">
            Pending bank and UPI requests to review, and crypto deposits CoinsBuy is still processing. Settled deposits are in Transaction History.
          </p>
        </div>

        <FundingStats rows={rows} variant="pending" />

        <FundingToolbar rows={rows} filters={filters} onChange={setFilters} statuses={["pending"]} />

        <FundingTable
          rows={visible}
          loading={loading}
          error={pendingQ.isError || cryptoQ.isError}
          onOpen={open}
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
        <CryptoTxDialog tx={selectedCrypto} onClose={() => setSelectedCrypto(null)} />
      </div>
    </DashboardLayout>
  );
}
