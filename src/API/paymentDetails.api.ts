import { baseApi } from "./baseApi";
import { ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * The broker's receiving details for bank / UPI deposits. There is ONE record
 * per broker: saving a field replaces it, an empty string removes it, and a
 * field left out of the request keeps its stored value. Clients read these on
 * the bank / UPI deposit screen (bank details to copy, a QR from the UPI ID).
 */
export interface PaymentDetails {
  upiId: string;
  usdtWallet: string;
  bankName: string;
  accountHolderName: string;
  bankAccountNo: string;
  bankIfscCode: string;
  updatedAt: string | null;
}

export type UpiDetailsPayload = { upiId: string };
export type BankDetailsPayload = {
  bankName: string;
  accountHolderName: string;
  bankAccountNo: string;
  bankIfscCode: string;
};
export type PaymentDetailsPayload = Partial<UpiDetailsPayload & BankDetailsPayload>;

export interface PaymentDetailsHistoryEntry {
  id: number;
  upiId: string;
  usdtWallet: string;
  bankName: string;
  accountHolderName: string;
  bankAccountNo: string;
  bankIfscCode: string;
  createdAt: string;
}

/**
 * INR per 1 USD for bank / UPI money. Deposits convert at depositRate,
 * withdrawals at withdrawRate. Null until the broker sets them, and bank / UPI
 * money does not move until both are set.
 */
export interface FiatRates {
  depositRate: number | null;
  withdrawRate: number | null;
  updatedAt: string | null;
  /** Market USD/INR from the FX feed, for reference; null when unavailable. */
  marketRate?: number | null;
  marketRateUpdatedAt?: string | null;
}

/** A bank / UPI deposit or withdrawal filed while a method was live. */
export interface MethodReceipt {
  id: number;
  userId: number;
  name: string;
  email: string;
  inrAmount: number | null;
  usdAmount: number;
  fxRate: number | null;
  /**
   * Deposit: the client's UTR (UPI) or transaction number (bank).
   * Withdrawal: the client's UPI ID or account it is paid to.
   */
  reference: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

/** One direction of money: totals per status, and the latest rows. */
export interface MoneyFlow {
  count: number;
  totalInr: number;
  totalUsd: number;
  approvedCount: number;
  approvedInr: number;
  approvedUsd: number;
  pendingCount: number;
  pendingInr: number;
  pendingUsd: number;
  rejectedCount: number;
  rejectedInr: number;
  rejectedUsd: number;
  /** Distinct clients among the listed rows. */
  clients: number;
  /** Newest first, capped at 200; the totals cover every row. */
  items: MethodReceipt[];
}

interface PeriodTotals {
  activeFrom: string;
  /** Null while it is the live one. */
  activeTo: string | null;
  isCurrent: boolean;
  deposits: MoneyFlow;
  withdrawals: MoneyFlow;
}

export interface UpiPeriod extends PeriodTotals {
  upiId: string;
  payeeName: string;
}

export interface BankPeriod extends PeriodTotals {
  bankName: string;
  accountHolderName: string;
  bankAccountNo: string;
  bankIfscCode: string;
}

export interface PaymentMethodChange {
  at: string;
  method: "UPI" | "BANK";
  /** Empty when the method was first added. */
  from: string;
  /** Empty when the method was removed. */
  to: string;
}

export interface PaymentReceipts {
  upi: UpiPeriod[];
  bank: BankPeriod[];
  changes: PaymentMethodChange[];
}

export const paymentDetailsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPaymentReceipts: build.query<PaymentReceipts, void>({
      query: () => ({ url: ENDPOINTS.PAYMENT_DETAILS.RECEIPTS, method: "GET" }),
      providesTags: [{ type: "PaymentDetails", id: "RECEIPTS" }],
    }),
    getFiatRates: build.query<FiatRates, void>({
      query: () => ({ url: ENDPOINTS.PAYMENT_DETAILS.FX_RATES, method: "GET" }),
      providesTags: [{ type: "PaymentDetails", id: "FX_RATES" }],
    }),
    setFiatRates: build.mutation<FiatRates, { depositRate: number; withdrawRate: number }>({
      query: (body) => ({
        url: ENDPOINTS.PAYMENT_DETAILS.FX_RATES,
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "PaymentDetails", id: "FX_RATES" }],
    }),
    getPaymentDetails: build.query<PaymentDetails, void>({
      query: () => ({ url: ENDPOINTS.PAYMENT_DETAILS.CURRENT, method: "GET" }),
      providesTags: [{ type: "PaymentDetails", id: "CURRENT" }],
    }),
    updatePaymentDetails: build.mutation<unknown, PaymentDetailsPayload>({
      query: (payload) => ({
        url: ENDPOINTS.PAYMENT_DETAILS.UPDATE,
        method: "POST",
        data: payload,
      }),
      invalidatesTags: [
        { type: "PaymentDetails", id: "CURRENT" },
        { type: "PaymentDetails", id: "HISTORY" },
        { type: "PaymentDetails", id: "RECEIPTS" },
      ],
    }),
    getPaymentDetailsHistory: build.query<PaymentDetailsHistoryEntry[], void>({
      query: () => ({ url: ENDPOINTS.PAYMENT_DETAILS.HISTORY, method: "GET" }),
      transformResponse: (res: unknown) =>
        Array.isArray(res) ? (res as PaymentDetailsHistoryEntry[]) : [],
      providesTags: [{ type: "PaymentDetails", id: "HISTORY" }],
    }),
  }),
});

export const {
  useGetPaymentDetailsQuery,
  useUpdatePaymentDetailsMutation,
  useGetPaymentDetailsHistoryQuery,
  useGetFiatRatesQuery,
  useSetFiatRatesMutation,
  useGetPaymentReceiptsQuery,
} = paymentDetailsApi;

/** The server's message from an RTK/axios error, or a fallback. */
export const apiErrorMessage = (error: unknown, fallback: string) => {
  const e = error as { status?: number; data?: unknown } | undefined;
  if (!e) return fallback;
  if (e.status === 401) return "Your session has expired. Please sign in again.";
  const data = e.data as { message?: unknown } | string | undefined;
  if (typeof data === "string" && data.trim()) {
    return /network error/i.test(data)
      ? "Can't reach the server. Check your connection and try again."
      : data;
  }
  if (data && typeof data === "object" && typeof data.message === "string" && data.message.trim()) {
    if (e.status && e.status >= 500) return "The server couldn't save this right now. Please try again.";
    return data.message;
  }
  return fallback;
};
