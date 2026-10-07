import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Bitcoin, Clock, type LucideIcon } from "lucide-react";
import type { Client, Transaction as UserTransaction } from "@/features/users/users.types";
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
import { useGetCryptoTransactionsQuery } from "@/API/transactions.api";
import { FundingToolbar } from "@/components/transactions/FundingToolbar";
import { FundingTable } from "@/components/transactions/FundingTable";
import { CryptoTxDialog } from "@/components/transactions/CryptoTxDialog";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { usdFmt } from "@/components/transactions/FxAmount";

interface DepositsWithdrawalsProps {
  client: Client;
  /** The client's bank / UPI transactions, as the users API returns them. */
  rawTransactions?: UserTransaction[];
  /** The user id, for the CoinsBuy transactions. */
  clientId?: number | string;
  loading?: boolean;
}

/** One client's deposits and withdrawals across bank, UPI and crypto. */
export function DepositsWithdrawals({
  client,
  rawTransactions = [],
  clientId,
  loading = false,
}: DepositsWithdrawalsProps) {
  const [filters, setFilters] = useState<FundingFilters>(DEFAULT_FUNDING_FILTERS);
  const [selectedManual, setSelectedManual] = useState<Transaction | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoTransaction | null>(null);

  const cryptoQ = useGetCryptoTransactionsQuery(
    clientId != null ? { userId: clientId } : undefined,
    { skip: clientId == null }
  );

  const rows: FundingRow[] = useMemo(() => {
    // The per-user endpoint leaves out name and email; they are this client's.
    const manual = rawTransactions.map((t) =>
      fromManual({ ...t, name: client.name, email: client.email } as unknown as Transaction)
    );
    return [...manual, ...(cryptoQ.data ?? []).map(fromCrypto)];
  }, [rawTransactions, cryptoQ.data, client.name, client.email]);

  const visible = useMemo(() => applyFundingFilters(rows, filters), [rows, filters]);

  const done = rows.filter((r) => r.status === "approved");
  const sum = (list: FundingRow[]) => list.reduce((s, r) => s + r.usd, 0);
  const deposits = done.filter((r) => r.direction === "deposit");
  const withdrawals = done.filter((r) => r.direction === "withdraw");
  const pending = rows.filter((r) => r.status === "pending");
  const crypto = done.filter((r) => r.method === "crypto");

  const tiles: { label: string; value: string; hint: string; icon: LucideIcon; tone: string }[] = [
    { label: "Total deposits", value: usdFmt(sum(deposits)), hint: `${deposits.length} completed`, icon: ArrowDownLeft, tone: "bg-emerald-100 text-emerald-600" },
    { label: "Total withdrawals", value: usdFmt(sum(withdrawals)), hint: `${withdrawals.length} completed`, icon: ArrowUpRight, tone: "bg-rose-100 text-rose-600" },
    { label: "Pending", value: String(pending.length), hint: usdFmt(sum(pending)), icon: Clock, tone: "bg-amber-100 text-amber-600" },
    { label: "Crypto volume", value: usdFmt(sum(crypto)), hint: `${crypto.length} transfers`, icon: Bitcoin, tone: "bg-orange-100 text-orange-600" },
  ];

  const open = (row: FundingRow) => {
    if (row.crypto) setSelectedCrypto(row.crypto);
    else if (row.manual) setSelectedManual(row.manual);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className={`rounded-lg p-2 ${t.tone}`}><t.icon className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{t.value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{t.label} · {t.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <FundingToolbar
        rows={rows}
        filters={filters}
        onChange={setFilters}
        showDirection
        // IB commission payouts, next to the method chips.
        showIb
      />

      <FundingTable
        rows={visible}
        loading={loading || cryptoQ.isLoading}
        error={cryptoQ.isError}
        onOpen={open}
        showType
      />

      <TransactionDetailModal
        transaction={selectedManual}
        isOpen={selectedManual !== null}
        onClose={() => setSelectedManual(null)}
      />
      <CryptoTxDialog tx={selectedCrypto} onClose={() => setSelectedCrypto(null)} />
    </div>
  );
}
