import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { FundingToolbar } from "@/components/transactions/FundingToolbar";
import { FundingTable } from "@/components/transactions/FundingTable";
import { FundingStats } from "@/components/transactions/FundingStats";
import { CryptoTxDialog } from "@/components/transactions/CryptoTxDialog";
import { FundingScopeTabs, type FundingScope } from "@/components/transactions/FundingScopeTabs";
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
import {
  useGetCryptoTransactionsQuery,
  useGetTransactionsQuery,
} from "@/API/transactions.api";

/** Row shape of the older TransactionsTable, still imported by its components. */
export interface TransactionRecord {
  id: string;
  date: string;
  clientName: string;
  email: string;
  amount: number;
  inrAmount?: number | null;
  fxRate?: number | null;
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
  const [filters, setFilters] = useState<FundingFilters>(DEFAULT_FUNDING_FILTERS);
  const [selectedManual, setSelectedManual] = useState<Transaction | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoTransaction | null>(null);
  const [scope, setScope] = useState<FundingScope>("all");

  // Settled only. Pending ones are the queues on Deposits and Withdrawals.
  const processedQ = useGetTransactionsQuery({ getAllPending: false });
  const cryptoQ = useGetCryptoTransactionsQuery();

  const settledRows: FundingRow[] = useMemo(
    () =>
      [
        ...(processedQ.data ?? []).map(fromManual),
        ...(cryptoQ.data ?? []).map(fromCrypto),
      ].filter((r) => r.status !== "pending"),
    [processedQ.data, cryptoQ.data]
  );
  const ibRows = useMemo(() => settledRows.filter((r) => r.isIb), [settledRows]);
  const rows = scope === "ib" ? ibRows : settledRows;

  const visible = useMemo(() => applyFundingFilters(rows, filters), [rows, filters]);

  const switchScope = (next: FundingScope) => {
    setScope(next);
    setFilters(DEFAULT_FUNDING_FILTERS);
  };

  const open = (row: FundingRow) => {
    if (row.crypto) setSelectedCrypto(row.crypto);
    else if (row.manual) setSelectedManual(row.manual);
  };

  return (
    <DashboardLayout title="Transaction History">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground">
            Settled deposits and withdrawals across bank, UPI and crypto. Pending ones are on the Deposits and Withdrawals pages.
          </p>
        </div>

        <FundingScopeTabs
          scope={scope}
          onChange={switchScope}
          counts={{ all: settledRows.length, ib: ibRows.length }}
        />

        <FundingStats rows={rows} variant="history" />

        {/* IB rows are all withdrawals, so the type filter and column only apply to All. */}
        <FundingToolbar
          rows={rows}
          filters={filters}
          onChange={setFilters}
          showDirection={scope === "all"}
          statuses={["approved", "rejected"]}
        />

        <FundingTable
          rows={visible}
          loading={processedQ.isLoading || cryptoQ.isLoading}
          error={processedQ.isError || cryptoQ.isError}
          onOpen={open}
          showType={scope === "all"}
        />

        <TransactionDetailModal
          transaction={selectedManual}
          isOpen={selectedManual !== null}
          onClose={() => setSelectedManual(null)}
        />
        <CryptoTxDialog tx={selectedCrypto} onClose={() => setSelectedCrypto(null)} />
      </div>
    </DashboardLayout>
  );
}
