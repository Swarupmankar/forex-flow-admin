import { baseApi } from "./baseApi";
import { ENDPOINTS } from "@/constants/apiEndpoints";

/**
 * The CoinsBuy rails' P&L.
 *
 * Deposits are a pure cost: the user is credited the gross amount they sent
 * while the merchant wallet only receives it net of CoinsBuy's commission. The
 * flat withdrawal service fee is what recovers that. So the wallet `surplus`
 * on the balances endpoint is expected to drift downward, and only means
 * something read next to these figures.
 */
export interface CryptoProfit {
  deposits: { count: number; volume: number; commissionPaid: number };
  withdrawals: {
    count: number;
    volume: number;
    commissionPaid: number;
    /**
     * Actual gas paid out of the merchant wallet, in USD -- read off each
     * payout's transfer after it settles, not the reserve quoted beforehand.
     * Excludes the coins where CoinsBuy let the fee come out of the payout
     * (BTC, LTC, DASH, BCH, DOGE, ZEC, ALGO, SOL, TON): the user paid there.
     */
    networkFeesPaid: number;
    serviceFeesEarned: number;
  };
  totals: { revenue: number; cost: number; net: number };
}

export const cryptoRailsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCryptoProfit: build.query<CryptoProfit, { from?: string; to?: string } | void>({
      query: (range) => ({
        url: ENDPOINTS.ADMIN_WALLET.CRYPTO_PROFIT,
        method: "GET",
        params: range ?? undefined,
      }),
      providesTags: ["CryptoRails"],
    }),

    getCryptoWithdrawFee: build.query<{ cryptoWithdrawFee: number }, void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_WALLET.CRYPTO_WITHDRAW_FEE,
        method: "GET",
      }),
      providesTags: ["CryptoRails"],
    }),

    setCryptoWithdrawFee: build.mutation<{ cryptoWithdrawFee: number }, number>({
      query: (cryptoWithdrawFee) => ({
        url: ENDPOINTS.ADMIN_WALLET.CRYPTO_WITHDRAW_FEE,
        method: "PUT",
        data: { cryptoWithdrawFee },
      }),
      // The fee changes what every future withdrawal earns, so the P&L above it
      // is stale the moment this succeeds.
      invalidatesTags: ["CryptoRails"],
    }),

    getIbMinWithdraw: build.query<{ ibMinWithdraw: number }, void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_WALLET.IB_MIN_WITHDRAW,
        method: "GET",
      }),
      providesTags: ["CryptoRails"],
    }),

    setIbMinWithdraw: build.mutation<{ ibMinWithdraw: number }, number>({
      query: (ibMinWithdraw) => ({
        url: ENDPOINTS.ADMIN_WALLET.IB_MIN_WITHDRAW,
        method: "PUT",
        data: { ibMinWithdraw },
      }),
      invalidatesTags: ["CryptoRails"],
    }),
  }),
});

export const {
  useGetCryptoProfitQuery,
  useGetCryptoWithdrawFeeQuery,
  useSetCryptoWithdrawFeeMutation,
  useGetIbMinWithdrawQuery,
  useSetIbMinWithdrawMutation,
} = cryptoRailsApi;
