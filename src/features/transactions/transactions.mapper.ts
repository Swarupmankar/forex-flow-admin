import type { Transaction } from "./transactions.types";

export type DepositRequestUI = {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  paymentMethod: "upi" | "bank-transfer" | "crypto";
  status: "pending" | "approved" | "rejected";
  paymentProof?: string | null;
  paymentDetails: {
    utr?: string | null;
    bankName?: string | null;
    walletAddress?: string | null;
  };
  submittedAt?: string;
};

export type TransactionRecordUI = {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  type: "deposit" | "withdrawal";
  paymentMethod?: string;
  transactionId?: string;
  status: "completed" | "pending" | "rejected";
  processedAt?: string;
};

export function mapToDepositRequestUI(t: Transaction): DepositRequestUI {
  const paymentMethod =
    t.mode === "UPI" ? "upi" : t.mode === "CRYPTO" ? "crypto" : "bank-transfer";

  const status =
    t.transactionStatus === "PENDING"
      ? "pending"
      : t.transactionStatus === "APPROVED"
      ? "approved"
      : "rejected";

  return {
    id: String(t.id),
    date: t.createdAt?.split("T")[0] ?? "",
    clientName: `User ${t.id}`, // Replace with real user name if you have user data
    amount: Number(t.amount),
    paymentMethod,
    status,
    paymentProof: (t as any).depositProof ?? null,
    paymentDetails: {
      utr: t.utrNo ?? null,
      bankName: t.bankName ?? null,
      walletAddress: t.cryptoAddress ?? null,
    },
    submittedAt: t.createdAt,
  };
}

export function mapToTransactionRecordUI(t: Transaction): TransactionRecordUI {
  const type = t.transactionType === "DEPOSIT" ? "deposit" : "withdrawal";
  const status =
    t.transactionStatus === "PENDING"
      ? "pending"
      : t.transactionStatus === "APPROVED"
      ? "completed"
      : "rejected";

  return {
    id: String(t.id),
    date: t.createdAt?.split("T")[0] ?? "",
    clientName: `User ${t.id}`,
    amount: Number(t.amount),
    type,
    paymentMethod: t.mode,
    transactionId: t.utrNo ?? String(t.id),
    status,
    processedAt: t.updatedAt,
  };
}
