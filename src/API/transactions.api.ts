import { baseApi } from "./baseApi";
import type { Transaction } from "@/features/transactions/transactions.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

type UpdateTransactionResponse = {
  transactionId?: number;
  id?: number;
  status?: string;
  rejectionReason?: string;
  message?: string;
};

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<Transaction[], { getAllPending?: boolean }>({
      query: (arg = { getAllPending: false }) => {
        const getAllPending = arg.getAllPending ? "true" : "false";
        return {
          url: ENDPOINTS.TRANSACTIONS.ALL_TRANSACTIONS,
          method: "GET",
          params: { getAllPending },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({
                type: "Transactions" as const,
                id: t.id,
              })),
              { type: "Transactions" as const, id: "LIST" },
            ]
          : [{ type: "Transactions" as const, id: "LIST" }],
    }),
    approveTransaction: build.mutation<
      UpdateTransactionResponse,
      { transactionId: number | string }
    >({
      query: ({ transactionId }) => ({
        url: ENDPOINTS.TRANSACTIONS.UPDATE_TRANSACTION,
        method: "POST",
        data: { transactionId, status: "APPROVED" },
      }),
      invalidatesTags: (_res, _err, args) => [
        { type: "Transactions" as const, id: Number(args.transactionId) },
        { type: "Transactions" as const, id: "LIST" },
      ],
    }),
    rejectTransaction: build.mutation<
      UpdateTransactionResponse,
      { transactionId: number | string; rejectionReason: string }
    >({
      query: ({ transactionId, rejectionReason }) => {
        const trimmedReason = (rejectionReason ?? "").toString().trim();
        const payload = {
          transactionId,
          status: "REJECTED",
          rejectionReason: trimmedReason,
        };
        console.log("RejectTransaction payload ->", payload);
        return {
          url: ENDPOINTS.TRANSACTIONS.UPDATE_TRANSACTION,
          method: "POST",
          data: payload,
        };
      },
      invalidatesTags: (_res, _err, args) => [
        { type: "Transactions" as const, id: Number(args.transactionId) },
        { type: "Transactions" as const, id: "LIST" },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetTransactionsQuery,
  useApproveTransactionMutation,
  useRejectTransactionMutation,
} = transactionsApi;

export default transactionsApi;
