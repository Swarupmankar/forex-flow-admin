import { baseApi } from "./baseApi";
import type {
  AccountingResponseRaw,
  AccountingDetails,
  WalletBalancesResponseRaw,
  WalletBalances,
  WithdrawResponse,
  WithdrawPayload,
  WithdrawHistory,
  WithdrawHistoryRaw,
} from "@/features/adminWallet/accounting.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

const toNumber = (v: string | number | undefined | null) => {
  if (v === undefined || v === null) return 0;
  const s =
    typeof v === "number" ? String(v) : String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountingDetails: build.query<AccountingDetails, void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_WALLET.ACCOUNTING_STATS,
        method: "GET",
      }),
      /** transformResponse converts server strings -> numbers and returns the typed model */
      transformResponse: (res: AccountingResponseRaw): AccountingDetails => {
        // helper to safely parse numeric strings to numbers (0 if invalid)
        const toNumber = (v: string | undefined) => {
          if (v === undefined || v === null) return 0;
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        return {
          totalDeposits: toNumber(res.totalDeposits),
          totalWithdrawals: toNumber(res.totalWithdrawals),
          netProfit: toNumber(res.netProfit),
          spreadEarning: toNumber(res.spreadEarning),
          lossesSaved: toNumber(res.lossesSaved),
          brokerFeesEarned: toNumber(res.brokerFeesEarned),
        };
      },
      providesTags: (_res) => [{ type: "Accounting" as const, id: "LIST" }],
    }),
    getWalletBalances: build.query<WalletBalances, void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_WALLET.WALLET_BALANCES,
        method: "GET",
      }),
      transformResponse: (res: WalletBalancesResponseRaw): WalletBalances => {
        // robust parser: accepts numbers or numeric strings, strips commas, returns 0 for invalid input
        const toNumber = (v: string | number | undefined | null) => {
          if (v === undefined || v === null) return 0;
          const s =
            typeof v === "number"
              ? String(v)
              : String(v).replace(/,/g, "").trim();
          const n = Number(s);
          return Number.isFinite(n) ? n : 0;
        };

        return {
          principalAccount: toNumber(res.principalAccount),
          netProfitMinusWithdrawn: toNumber(res.netProfitMinusWithdrawn),
          principalAmountWithdrawn: toNumber(res.principalAmountWithdrawn),
        };
      },
      providesTags: (_res) => [{ type: "Accounting" as const, id: "LIST" }],
    }),
    withdrawBalances: build.mutation<WithdrawResponse, WithdrawPayload>({
      query: (payload) => {
        const req = {
          url: ENDPOINTS.ADMIN_WALLET.WITHDRAW_BALANCES,
          method: "POST",
          data: payload,
        };
        return req;
      },
      invalidatesTags: [{ type: "Accounting", id: "LIST" }],
    }),
    replenishBalances: build.mutation<
      WithdrawResponse,
      { amount: number; walletType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT" }
    >({
      query: (payload) => {
        console.log(
          "[accountingApi] replenishBalances: payload (from UI):",
          payload
        );
        const req = {
          url: ENDPOINTS.ADMIN_WALLET.REPLENISH_BALANCES,
          method: "POST",
          data: payload,
        };
        console.log(
          "[accountingApi] replenishBalances: request object ->",
          req
        );
        return req;
      },
      invalidatesTags: [{ type: "Accounting", id: "LIST" }],
    }),
    getWithdrawHistory: build.query<WithdrawHistory[], void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_WALLET.WITHDRAW_HISTORY,
        method: "GET",
      }),
      transformResponse: (res: WithdrawHistoryRaw[]): WithdrawHistory[] => {
        if (!Array.isArray(res)) return [];
        return res.map((r) => ({
          id: r.id,
          amount: toNumber(r.amount),
          action: r.action,
          principalBalance: toNumber(r.principalBalance),
          balanceType: r.balanceType,
          withdrawNetwork: r.withdrawNetwork ?? null,
          withdrawToCryptoAddress: r.withdrawToCryptoAddress ?? null,
          withdrawCryptoTx: r.withdrawCryptoTx ?? null,
          createdAt: r.createdAt,
          walletBalancesId: r.walletBalancesId ?? null,
        }));
      },
      providesTags: (_res) =>
        _res
          ? [
              ..._res.map((h) => ({
                type: "Accounting" as const,
                id: h.id,
              })),
              { type: "Accounting" as const, id: "LIST" },
            ]
          : [{ type: "Accounting" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAccountingDetailsQuery,
  useGetWalletBalancesQuery,
  useWithdrawBalancesMutation,
  useReplenishBalancesMutation,
  useGetWithdrawHistoryQuery,
} = accountingApi;
