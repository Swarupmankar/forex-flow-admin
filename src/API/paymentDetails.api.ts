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

export const paymentDetailsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
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
