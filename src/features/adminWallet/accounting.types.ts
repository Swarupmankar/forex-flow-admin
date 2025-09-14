/** Raw API response exactly as returned by server */
export type AccountingResponseRaw = {
  totalDeposits: string;
  totalWithdrawals: string;
  netProfit: string;
  spreadEarning: string;
  lossesSaved: string;
  brokerFeesEarned: string;
};

/** Normalized/typed model used within the app (numbers) */
export type AccountingDetails = {
  totalDeposits: number;
  totalWithdrawals: number;
  netProfit: number;
  spreadEarning: number;
  lossesSaved: number;
  brokerFeesEarned: number;
};

export type WalletBalancesResponseRaw = {
  principalAccount: string;
  netProfitMinusWithdrawn: string;
  principalAmountWithdrawn: string;
};

/** Normalized/typed model used within the app (numbers) */
export type WalletBalances = {
  principalAccount: number;
  netProfitMinusWithdrawn: number;
  principalAmountWithdrawn: number;
};

/** Withdraw payload used by the API */
export type WithdrawPayload = {
  amount: number;
  walletType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT";
  withdrawNetwork: string;
  withdrawToCryptoAddress: string;
  withdrawCryptoTx: string;
};

/** Withdraw response (loose typed — adapt to your server's shape) */
export type WithdrawResponse = {
  success?: boolean;
  message?: string;
  data?: any;
};

export type WithdrawHistoryRaw = {
  id: number;
  amount: string;
  action: string; // e.g. "WITHDRAW"
  principalBalance: string;
  balanceType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT" | string;
  withdrawNetwork?: string | null;
  withdrawToCryptoAddress?: string | null;
  withdrawCryptoTx?: string | null;
  createdAt: string; // ISO
  walletBalancesId?: number | null;
};

/** Normalized history used in the UI */
export type WithdrawHistory = {
  id: number;
  amount: number;
  action: string;
  principalBalance: number;
  balanceType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT" | string;
  withdrawNetwork?: string | null;
  withdrawToCryptoAddress?: string | null;
  withdrawCryptoTx?: string | null;
  createdAt: string; // keep ISO string for storage (or Date if you prefer)
  walletBalancesId?: number | null;
};
