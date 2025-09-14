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
    getCommissionWithdrawals: build.query<Transaction[], void>({
      query: () => {
        return {
          url: ENDPOINTS.TRANSACTIONS.COMMISSION_WITHDRAWAL_REQUESTS,
          method: "GET",
        };
      },

      // transform backend commission response -> Transaction[]
      transformResponse: (response: any) => {
        // expected response shape: { data: [ { id, userId, amount, month, status, method, walletAddress, rejectionReason, user: { id, email, firstName, lastName }, createdAt, updatedAt, ... }, ... ] }
        const arr =
          response && Array.isArray(response.data) ? response.data : [];

        const mapped: Transaction[] = arr.map((c: any) => {
          const user = c.user ?? {};
          const name =
            user.firstName || user.lastName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : `User ${c.userId ?? c.id}`;

          return {
            id: Number(c.id),
            transactionType: "WITHDRAW", // treat commission payouts as withdraws for UI
            transactionStatus: (c.status ?? "PENDING")
              .toString()
              .toUpperCase() as Transaction["transactionStatus"],
            mode: (c.method ?? "CRYPTO") as Transaction["mode"],
            amount: String(c.amount ?? "0"),
            upiId: null,
            utrNo: null,
            bankName: null,
            bankAccountNo: null,
            bankIfsc: null,
            // map commission walletAddress -> cryptoAddress so UI sees it as crypto/wallet
            cryptoAddress: c.walletAddress ?? null,
            cryptoNetwork: null,
            depositProof: null,
            fromAccountId: null,
            toAccountId: null,
            userId: c.userId ?? user.id ?? null,
            name,
            email: user.email ?? "",
            remainingBalance: null,
            balanceType: null,
            accountIdentifier: `COMMISSION:${c.month ?? ""}`, // marker to detect commission rows in UI
            rejectionReason: c.rejectionReason ?? null,
            createdAt: c.createdAt ?? new Date().toISOString(),
            updatedAt: c.updatedAt ?? new Date().toISOString(),
          } as Transaction;
        });

        return mapped;
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
    updateCommissionRequest: build.mutation<
      // response type (approx)
      { message?: string; success?: boolean; id?: number },
      // arg type
      {
        userId: number | string;
        commissionWithdrawRequestId: number | string;
        action: "PAID" | "REJECTED";
        rejectionMessage?: string;
      }
    >({
      query: (payload) => {
        return {
          url: ENDPOINTS.TRANSACTIONS.UPDATE_COMMISSION_REQUEST,
          method: "PATCH",
          data: payload,
        };
      },
      // Invalidate the list and the specific commission id so UI refreshes
      invalidatesTags: (_res, _err, args) => [
        // try to invalidate by numeric id if possible
        {
          type: "Transactions" as const,
          id: Number(args.commissionWithdrawRequestId),
        },
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
  useGetCommissionWithdrawalsQuery,
  useUpdateCommissionRequestMutation,
} = transactionsApi;

export default transactionsApi;
