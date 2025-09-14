import { baseApi } from "./baseApi";
import type {
  UserListResponse,
  ListUsersQueryArgs,
  UserDetails,
  UserDetailsResponse,
  UserTransactionsResponse,
  TradingAccountsResponse,
  CustomMessagePayload,
  CustomMessageItem,
} from "@/features/users/users.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<UserListResponse, ListUsersQueryArgs | void>({
      query: (args: ListUsersQueryArgs = { page: 1, limit: 10 }) => ({
        url: ENDPOINTS.USERS,
        method: "GET",
        params: args,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map((u) => ({
                type: "Users" as const,
                id: u.accountId,
              })),
              { type: "Users" as const, id: "LIST" },
            ]
          : [{ type: "Users" as const, id: "LIST" }],
      transformResponse: (response: UserListResponse) => ({
        ...response,
        results: response.results.map((u) => ({
          ...u,
          walletBalance: Number(u.walletBalance),
          registrationDate: u.registrationDate,
        })),
      }),
    }),

    /** -------- NEW: fetch single user by id -------- */
    getUserById: build.query<UserDetails, number | string>({
      query: (id) => ({
        url: `${ENDPOINTS.USERBYID}/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Users", id }],
      transformResponse: (r: UserDetailsResponse): UserDetails => ({
        ...r,
        walletBalance: Number(r.walletBalance),
        totalDeposits: Number(r.totalDeposits),
        totalWithdrawals: Number(r.totalWithdrawals),
      }),
    }),

    /** -------- fetch user transactions -------- */
    getUserTransactions: build.query<UserTransactionsResponse, number | string>(
      {
        query: (id) => ({
          url: `${ENDPOINTS.USER_TRANSACTIONS}/${id}`,
          method: "GET",
        }),
        providesTags: (_res, _err, id) => [
          { type: "Users", id: `transactions-${id}` },
        ],
        transformResponse: (
          r: UserTransactionsResponse
        ): UserTransactionsResponse => ({
          ...r,
          totalDepositAmount: String(r.totalDepositAmount ?? "0"),
          totalWithdrawAmount: String(r.totalWithdrawAmount ?? "0"),
          transactions: r.transactions.map((t) => ({
            ...t,
            amount: String(t.amount),
          })),
        }),
      }
    ),

    /** -------- fetch trading accounts -------- */
    getTradingAccounts: build.query<TradingAccountsResponse, number | string>({
      query: (id) => ({
        url: `${ENDPOINTS.TRADING_ACCOUNTS}/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [
        { type: "Users", id: `accounts-${id}` },
      ],
      transformResponse: (
        r: TradingAccountsResponse
      ): TradingAccountsResponse => ({
        ...r,
        totalBalance: String(r.totalBalance ?? "0"),
        avgLeverage: String(r.avgLeverage ?? "0"),
        allTradingAccounts: r.allTradingAccounts.map((a) => ({
          ...a,
          fundsAvailable: String(a.fundsAvailable),
        })),
      }),
    }),

    /** --------  send custom message -------- */
    sendCustomMessage: build.mutation<any, CustomMessagePayload>({
      query: (payload) => ({
        url: ENDPOINTS.CUSTOM_MESSAGE,
        method: "POST",
        data: payload,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Users" as const, id: arg.userId },
      ],
    }),

    /** GET /custom-message-history/:userId */
    getCustomMessageHistory: build.query<CustomMessageItem[], number | string>({
      query: (userId) => ({
        url: `${ENDPOINTS.CUSTOM_MESSAGE_HISTORY}/${userId}`,
        method: "GET",
      }),
      providesTags: (_res, _err, userId) => [
        { type: "Users" as const, id: userId },
      ],
      transformResponse: (res: CustomMessageItem[]): CustomMessageItem[] =>
        res.map((m) => ({
          ...m,
          // keep createdAt/updatedAt as-is; also useful to normalize a `date` field for UI
          date: m.createdAt ?? m.date,
        })),
    }),

    updateAccountStatus: build.mutation<
      any,
      {
        userId: number | string;
        tradingAccountId: number | string;
        accountStatus: "ACTIVE" | "ARCHIVE";
      }
    >({
      query: (payload) => ({
        // using absolute path as you provided; replace with ENDPOINTS if you have one
        url: ENDPOINTS.ISACTIVE,
        method: "PUT",
        data: payload,
      }),
      // optionally invalidate accounts for the user so UI can refetch if needed
      invalidatesTags: (arg) => [
        { type: "Users" as const, id: `accounts-${arg.userId}` },
        { type: "Users" as const, id: arg.userId },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useListUsersQuery,
  useGetUserByIdQuery,
  useGetUserTransactionsQuery,
  useGetTradingAccountsQuery,
  useSendCustomMessageMutation,
  useGetCustomMessageHistoryQuery,
  useUpdateAccountStatusMutation,
} = usersApi;
