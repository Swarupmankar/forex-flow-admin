// src/features/transactions/transactions.types.ts

export interface Transaction {
  id: number;
  transactionType: "DEPOSIT" | "WITHDRAW";
  transactionStatus: "APPROVED" | "PENDING" | "REJECTED";
  mode: "BANK" | "UPI" | "CRYPTO" | string;
  amount: string;
  /** Bank / UPI only: rupees paid in or out. */
  inrAmount?: string | null;
  /** Bank / UPI only: INR per 1 USD, fixed when the request was filed. */
  fxRate?: string | null;
  upiId?: string | null;
  utrNo?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  cryptoAddress?: string | null;
  cryptoNetwork?: string | null;
  depositProof?: string | null;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  userId?: number | null;
  name: string;
  email: string;
  remainingBalance?: string | null;
  balanceType?: string | null;
  accountIdentifier?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  status?: string;
}

export interface UserTransactionsResponse {
  totalDepositAmount?: string;
  totalDepositCount?: number;
  totalWithdrawAmount?: string;
  totalWithdrawCount?: number;
  transactions: Transaction[];
}

/** A CoinsBuy deposit or withdrawal. `usdAmount` is what moved the wallet. */
export interface CryptoTransaction {
  id: number;
  userId: number;
  name: string;
  email: string;
  action: "DEPOSIT" | "WITHDRAW";
  /** MAIN is the client's crypto wallet; IB an IB paying out commission. */
  kind: "MAIN" | "IB";
  status: "PENDING" | "COMPLETED" | "FAILED";
  coin: string | null;
  network: string | null;
  coinAmount: number | null;
  usdAmount: number;
  /** As CoinsBuy reported it at execution. */
  appliedRate: number | null;
  /** Our flat fee on a withdrawal, in USD. */
  serviceFee: number | null;
  /** In networkFeeCoin, not USD. */
  networkFee: number | null;
  networkFeeCoin: string | null;
  providerCommission: number | null;
  txHash: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}
