export interface AccountBalances {
  principalAccount: number;
  netProfit: number;
  principalAccountMinusWithdrawn: number;
  netProfitMinusWithdrawn: number;
  principalAmountWithdrawn: number;
  netProfitAmountWithdrawn: number;
}

export interface WithdrawalHistory {
  id: number;
  amount: string;
  principalBalance: string;
  withdrawBalanceType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT";
  createdAt: string;
  walletBalancesId: number;
}

export interface WalletStats {
  totalDeposits: string;
  totalWithdrawals: string;
  netProfit: string;
  spreadEarning: string;
  lossesSaved: string;
  brokerFeesEarned: string;
}

export const ACCOUNT_BALANCES: AccountBalances = {
  principalAccount: 664500,
  netProfit: 9019.99,
  principalAccountMinusWithdrawn: 664490,
  netProfitMinusWithdrawn: 9019.99,
  principalAmountWithdrawn: 10,
  netProfitAmountWithdrawn: 0
};

export const WITHDRAWAL_HISTORY: WithdrawalHistory[] = [
  {
    id: 1,
    amount: "10",
    principalBalance: "663510",
    withdrawBalanceType: "PRINCIPAL_ACCOUNT",
    createdAt: "2025-09-06T23:16:30.746Z",
    walletBalancesId: 1
  },
  {
    id: 2,
    amount: "10",
    principalBalance: "663500",
    withdrawBalanceType: "PRINCIPAL_ACCOUNT",
    createdAt: "2025-09-06T23:16:39.521Z",
    walletBalancesId: 1
  }
];

export const WALLET_STATS: WalletStats = {
  totalDeposits: "10500",
  totalWithdrawals: "0.01",
  netProfit: "9019.99",
  spreadEarning: "0",
  lossesSaved: "0",
  brokerFeesEarned: "20"
};