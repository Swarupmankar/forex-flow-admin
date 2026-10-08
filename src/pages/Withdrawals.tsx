import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { WithdrawalDetailDrawer } from "@/components/withdrawals/WithdrawalDetailDrawer";

import type {
  CryptoTransaction,
  Transaction as ApiTransaction,
} from "@/features/transactions/transactions.types";
import {
  DEFAULT_FUNDING_FILTERS,
  applyFundingFilters,
  fromCrypto,
  fromManual,
  type FundingFilters,
  type FundingRow,
} from "@/features/transactions/funding";
import { FundingToolbar } from "@/components/transactions/FundingToolbar";
import { FundingTable } from "@/components/transactions/FundingTable";
import { FundingStats } from "@/components/transactions/FundingStats";
import { CryptoTxDialog } from "@/components/transactions/CryptoTxDialog";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { FundingScopeTabs, type FundingScope } from "@/components/transactions/FundingScopeTabs";
import { toast } from "sonner";
import { toNum } from "@/components/transactions/FxAmount";
import {
  useGetTransactionsQuery,
  useGetCryptoTransactionsQuery,
  useApproveTransactionMutation,
  useRejectTransactionMutation,
} from "@/API/transactions.api";

export interface WithdrawalRequest {
  id: string;
  clientName: string;
  email: string;
  amount: number;
  inrAmount: number | null;
  fxRate: number | null;
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
    inrAmount: toNum(t.inrAmount),
    fxRate: toNum(t.fxRate),
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
  const [filters, setFilters] = useState<FundingFilters>(DEFAULT_FUNDING_FILTERS);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoTransaction | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [scope, setScope] = useState<FundingScope>("all");

  // The queue only: what is still pending. Settled payouts are on Transaction History.
  const pendingQ = useGetTransactionsQuery({ getAllPending: true });
  const cryptoQ = useGetCryptoTransactionsQuery({ action: "WITHDRAW" });

  const [approveMutation] = useApproveTransactionMutation();
  const [rejectMutation] = useRejectTransactionMutation();

  const allRows: FundingRow[] = useMemo(() => {
    const manual = (pendingQ.data ?? [])
      .filter((t) => (t.transactionType ?? "").toString().toUpperCase() === "WITHDRAW")
      .map(fromManual);
    const crypto = (cryptoQ.data ?? []).map(fromCrypto);
    return [...manual, ...crypto];
  }, [pendingQ.data, cryptoQ.data]);

  // Both tabs are the queue: pending only. IB is the same queue narrowed to IB
  // commission payouts; settled ones of either kind are on Transaction History.
  const pendingRows = useMemo(() => allRows.filter((r) => r.status === "pending"), [allRows]);
  const pendingIbRows = useMemo(() => pendingRows.filter((r) => r.isIb), [pendingRows]);
  const rows = scope === "ib" ? pendingIbRows : pendingRows;

  const visible = useMemo(() => applyFundingFilters(rows, filters), [rows, filters]);

  const switchScope = (next: FundingScope) => {
    setScope(next);
    setSelected([]);
    setFilters(DEFAULT_FUNDING_FILTERS);
  };

  const open = (row: FundingRow) => {
    if (row.crypto) setSelectedCrypto(row.crypto);
    else if (row.manual) setSelectedWithdrawal(mapTransactionToWithdrawal(row.manual as ApiTransaction));
  };

  const errMsg = (err: unknown, fallback: string) =>
    (err as { data?: { message?: string } })?.data?.message || fallback;

  const handleApprove = async (id: string) => {
    try {
      await approveMutation({ transactionId: Number(id) }).unwrap();
      toast.success("Withdrawal approved");
      setSelectedWithdrawal(null);
      setSelected((prev) => prev.filter((k) => k !== `m-${id}`));
    } catch (err) {
      toast.error(errMsg(err, "Failed to approve withdrawal"));
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    const trimmed = (reason ?? "").trim();
    if (!trimmed) {
      toast.error("A rejection reason is required");
      return;
    }
    try {
      await rejectMutation({ transactionId: Number(id), rejectionReason: trimmed }).unwrap();
      toast.success("Withdrawal rejected");
      setSelectedWithdrawal(null);
      setSelected((prev) => prev.filter((k) => k !== `m-${id}`));
    } catch (err) {
      toast.error(errMsg(err, "Failed to reject withdrawal"));
    }
  };

  const handleBulkApprove = async () => {
    const ids = rows.filter((r) => selected.includes(r.key)).map((r) => r.id);
    if (!ids.length) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => approveMutation({ transactionId: id }).unwrap())
    );
    setBulkBusy(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) toast.error(`${ids.length - failed} approved, ${failed} failed`);
    else toast.success(`${ids.length} withdrawals approved`);
    setSelected([]);
  };

  const loading = pendingQ.isLoading || cryptoQ.isLoading;

  return (
    <DashboardLayout title="Withdrawals">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
            <p className="text-sm text-muted-foreground">
              Pending bank and UPI payouts to approve, and crypto payouts CoinsBuy is still sending. Settled payouts are in Transaction History.
            </p>
          </div>
          {selected.length > 0 && (
            <Button onClick={handleBulkApprove} disabled={bulkBusy} className="gap-2">
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Approve {selected.length} selected
            </Button>
          )}
        </div>

        <FundingScopeTabs
          scope={scope}
          onChange={switchScope}
          counts={{ all: pendingRows.length, ib: pendingIbRows.length }}
          tone="pending"
        />

        <FundingStats rows={rows} variant="pending" />

        <FundingToolbar
          rows={rows}
          filters={filters}
          onChange={setFilters}
          statuses={["pending"]}
        />

        <FundingTable
          rows={visible}
          loading={loading}
          error={pendingQ.isError || cryptoQ.isError}
          onOpen={open}
          selected={selected}
          onSelectedChange={setSelected}
        />

        <WithdrawalDetailDrawer
          request={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onStatusUpdate={(id, status, notes) => {
            if (status === "approved") handleApprove(id);
            else if (status === "rejected") handleReject(id, notes);
          }}
        />
        <CryptoTxDialog tx={selectedCrypto} onClose={() => setSelectedCrypto(null)} />
      </div>
    </DashboardLayout>
  );
}
