// src/features/transactions/transactions.types.ts

export interface Transaction {
  id: number;
  transactionType: "DEPOSIT" | "WITHDRAW";
  transactionStatus: "APPROVED" | "PENDING" | "REJECTED";
  mode: "BANK" | "UPI" | "CRYPTO" | string;
  amount: string;
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
