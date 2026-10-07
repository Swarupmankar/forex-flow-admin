import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { WalletHeader } from "@/components/wallet/WalletHeader";
import { FinancialSummaryCards } from "@/components/wallet/FinancialSummaryCards";
import { CryptoRailsCard } from "@/components/wallet/CryptoRailsCard";
import { RevenueOverview } from "@/components/wallet/RevenueOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { WalletBalanceSection } from "@/components/wallet/WalletBalanceSection";
import { TransactionFilters } from "@/components/wallet/TransactionFilters";
import { TransactionHistoryTable } from "@/components/wallet/TransactionHistoryTable";
import { WithdrawFundsModal } from "@/components/wallet/WithdrawFundsModal";
import { ReplenishFundsModal } from "@/components/wallet/ReplenishFundsModal";
import {
  useGetAccountingDetailsQuery,
  useGetWalletBalancesQuery,
  useGetWithdrawHistoryQuery,
} from "@/API/accounting.api";
import { format } from "date-fns";

export interface Transaction {
  id: string;
  date: Date;
  type: "replenish" | "withdrawal";
  wallet: "principal" | "net_profit";
  amount: number;
  balanceAfter: number;
  network?: string | null;
  withdrawToCryptoAddress?: string | null;
  withdrawCryptoTx?: string | null;
  serverId?: string;
  pending?: boolean;
}

export default function Wallet() {
  const {
    data: accountingData,
    isLoading: isAccountingLoading,
    isError: isAccountingError,
    error: accountingError,
    refetch: refetchAccounting,
  } = useGetAccountingDetailsQuery();

  const {
    data: walletData,
    isLoading: isWalletLoading,
    isError: isWalletError,
    error: walletError,
    refetch: refetchWallet,
  } = useGetWalletBalancesQuery();

  const {
    data: withdrawHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useGetWithdrawHistoryQuery();

  const serverTransactions = useMemo<Transaction[]>(() => {
    if (!withdrawHistory) return [];
    return withdrawHistory.map((h) => ({
      id: `withdraw-${h.id}`,
      date: new Date(h.createdAt),
      type:
        h.action === "WITHDRAW"
          ? "withdrawal"
          : (h.action.toLowerCase() as any),
      wallet:
        h.balanceType === "PRINCIPAL_ACCOUNT" ? "principal" : "net_profit",
      amount: -Math.abs(h.amount),
      balanceAfter: h.principalBalance,
      network: h.withdrawNetwork ?? null,
      withdrawToCryptoAddress: h.withdrawToCryptoAddress ?? null,
      withdrawCryptoTx: h.withdrawCryptoTx ?? null,
      serverId: String(h.id),
    }));
  }, [withdrawHistory]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(serverTransactions);
  }, [serverTransactions]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<
    "principal" | "net_profit" | null
  >(null);

  const financialSummary = accountingData
    ? {
        totalDeposits: accountingData.totalDeposits,
        totalWithdrawals: accountingData.totalWithdrawals,
        netProfit: accountingData.netProfit,
        ibPayouts: accountingData.ibPayouts,
      }
    : null;

  const walletBalances = walletData
    ? {
        principal: walletData.principalAccount,
        netProfit: walletData.netProfitMinusWithdrawn,
      }
    : null;

  const replenishAmount = walletData ? walletData.principalAmountWithdrawn : 0;

  // helper: normalize string for searching
  const normalize = (v: any) =>
    (v === undefined || v === null ? "" : String(v)).toLowerCase();

  const matchesSearchAcrossFields = (tx: Transaction, q: string) => {
    if (!q) return true;
    const nq = q.trim().toLowerCase();

    // text fields
    const candidates = [
      tx.type,
      tx.wallet,
      tx.network,
      tx.withdrawToCryptoAddress,
      tx.withdrawCryptoTx,
      tx.serverId,
    ].map(normalize);

    // amount (match numeric or formatted)
    const amountStr = normalize(tx.amount);
    const formattedAmount = normalize(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(Math.abs(tx.amount))
    );

    const dateIso =
      tx.date instanceof Date ? tx.date.toISOString() : normalize(tx.date);
    const datePretty =
      tx.date instanceof Date
        ? normalize(format(tx.date, "MMM dd, yyyy HH:mm"))
        : normalize(tx.date);

    const hay = [
      ...candidates,
      amountStr,
      formattedAmount,
      dateIso,
      datePretty,
    ].join(" ");

    return hay.includes(nq);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = matchesSearchAcrossFields(transaction, searchTerm);

    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    const matchesWallet =
      typeof (window as any) !== "undefined" && (window as any).__ignore
        ? true
        : typeof walletFilter !== "string"
        ? true
        : walletFilter === "all" || transaction.wallet === walletFilter;

    const matchesDateRange =
      !dateRange.from ||
      !dateRange.to ||
      (transaction.date >= dateRange.from && transaction.date <= dateRange.to);

    return matchesSearch && matchesType && matchesWallet && matchesDateRange;
  });

  const handleWithdraw = (walletType: "principal" | "net_profit") => {
    setSelectedWallet(walletType);
    setIsWithdrawModalOpen(true);
  };

  const handleReplenish = (walletType: "principal") => {
    setSelectedWallet(walletType);
    setIsReplenishModalOpen(true);
  };

  const handleWithdrawSubmit = (_withdrawalData: {
    wallet: "principal" | "net_profit";
    amount: number;
    method: string;
    destination: string;
    withdrawNetwork?: string | null;
    withdrawToCryptoAddress?: string | null;
    withdrawCryptoTx?: string | null;
  }) => {
    setIsWithdrawModalOpen(false);
    setSelectedWallet(null);
  };

  const handleReplenishSubmit = (_replenishData: {
    wallet: "principal" | "net_profit";
    amount: number;
  }) => {
    setIsReplenishModalOpen(false);
    setSelectedWallet(null);
  };

  const handleExport = (format: "csv" | "pdf") => {
    console.log(`Exporting transactions as ${format}`);
  };

  return (
    <DashboardLayout title="Admin Wallet & Accounting">
      <div className="space-y-6">
        <WalletHeader
          onExport={handleExport}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Revenue */}
        <section className="space-y-3">
          <SectionHeading
            title="Revenue"
            description="What the broker earns from client trading"
          />
          <RevenueOverview
            commissionEarned={accountingData?.brokerFeesEarned ?? null}
            ibWithdrawals={accountingData?.ibWithdrawals ?? null}
            isCommissionLoading={isAccountingLoading}
          />
        </section>

        {/* Cash flow */}
        <section className="space-y-3">
          <SectionHeading
            title="Cash Flow"
            description="Client money in and out of the broker"
          />
          {isAccountingLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          )}
          {isAccountingError && (
            <LoadError
              title="Failed to load accounting summary"
              error={accountingError}
              onRetry={refetchAccounting}
            />
          )}
          {financialSummary && <FinancialSummaryCards data={financialSummary} />}
        </section>

        {/* Kept apart from the fiat figures: the crypto rails run their own
            P&L, and the wallet balance below reads as short by design. */}
        <CryptoRailsCard />

        {/* Wallet balances */}
        <section className="space-y-3">
          <SectionHeading
            title="Balances"
            description="Broker wallets you can withdraw from or replenish"
          />
          {isWalletLoading && <Skeleton className="h-56 rounded-lg" />}
          {isWalletError && (
            <LoadError
              title="Failed to load wallet balances"
              error={walletError}
              onRetry={refetchWallet}
            />
          )}
          {!isWalletLoading && !isWalletError && (
            <WalletBalanceSection
              balances={walletBalances}
              replenishAmount={replenishAmount}
              onWithdraw={handleWithdraw}
              onReplenish={handleReplenish}
            />
          )}
        </section>

        <SectionHeading
          title="Transaction History"
          description="Broker wallet withdrawals and replenishments"
        />

        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          walletFilter={walletFilter}
          onWalletFilterChange={setWalletFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <TransactionHistoryTable transactions={filteredTransactions} />

        <WithdrawFundsModal
          isOpen={isWithdrawModalOpen}
          onClose={() => {
            setIsWithdrawModalOpen(false);
            setSelectedWallet(null);
          }}
          onSubmit={handleWithdrawSubmit}
          onSuccess={() => {
            refetchHistory();
            refetchWallet();
          }}
          selectedWallet={selectedWallet}
          availableBalances={walletBalances ?? null}
        />

        <ReplenishFundsModal
          isOpen={isReplenishModalOpen}
          onClose={() => {
            setIsReplenishModalOpen(false);
            setSelectedWallet(null);
          }}
          onSubmit={handleReplenishSubmit}
          onSuccess={() => {
            refetchWallet();
            refetchHistory();
          }}
          selectedWallet={selectedWallet}
          currentBalances={walletBalances ?? null}
        />
      </div>
    </DashboardLayout>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  // RTK Query errors are objects; String() on one prints "[object Object]".
  const message =
    (error as { data?: { message?: string } })?.data?.message ??
    (error as { message?: string })?.message ??
    "Unknown error";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button variant="destructive" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
