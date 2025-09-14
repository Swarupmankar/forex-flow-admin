export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/v1";

export const ENDPOINTS = {
  AUTH: "/broker/auth/login",
  USERS: "/broker/user-management/users",
  USERBYID: "/broker/user-management/user",
  KYC_ALL_REQUESTS: "/broker/user-management/kyc/all-requests",
  KYC_REVIEW: (kycId: number | string) =>
    `/broker/user-management/kyc/${kycId}/review`,
  KYC_DELETE: (kycId: number | string) =>
    `/broker/user-management/kyc/${kycId}/delete`,

  USER_TRANSACTIONS: "/broker/client/user-transactions",
  TRADING_ACCOUNTS: "/broker/client/trading-accounts",
  CUSTOM_MESSAGE: "/broker/client/custom-message",
  CUSTOM_MESSAGE_HISTORY: "/broker/client/custom-message-history",
  ISACTIVE: "/broker/client/update-accounts",

  SUPPORT: {
    ALL_TICKETS: "/broker/support/all-tickets",
    TICKET_BY_ID: (id: number) => `/broker/support/all-tickets/${id}`,
    TICKET_REPLY: (id: number) => `/broker/support/ticket/${id}/reply`,
    TICKET_CLOSE: (id: number) => `/broker/support/ticket/${id}/close`,
  },
  PLANS: {
    CREATE: "/broker/plans/create",
    ALL: "broker/plans/all",
    DELETE: (id: number) => `/broker/plans/delete/${id}`,
    TOGGLE: (id: number) => `/broker/plans/${id}/toggle`,
    UPDATE: (id: number) => `/broker/plans/update/${id}`,
  },
  SPREAD_PROFILES: {
    ALL: "/broker/spread-profile/all-profiles",
    CREATE: "/broker/spread-profile/add",
    UPDATE: (id: number) => `/broker/spread-profile/${id}/update`,
    DELETE: (id: number) => `/broker/spread-profile/${id}`,
  },
  NOTIFICATIONS: {
    ALL: "/broker/notification/all-notifications",
    CREATE: "/broker/notification/add",
    UPDATE: "/broker/notification/update",
    DELETE: (id: number) => `/broker/notification/${id}`,
  },

  TRANSACTIONS: {
    ALL_TRANSACTIONS: "/broker/user-management/get-transactions",
    UPDATE_TRANSACTION: "/broker/user-management/update-transactions",
    COMMISSION_WITHDRAWAL_REQUESTS: "/broker/transaction/commission-requests",
    UPDATE_COMMISSION_REQUEST: "/broker/transaction/update-commission-request",
  },

  ADMIN_WALLET: {
    ACCOUNTING_STATS: "/broker/admin-wallet/accounting-details",
    WALLET_BALANCES: "/broker/admin-wallet/wallet-balances",
    WITHDRAW_BALANCES: "/broker/admin-wallet/withdraw-balances",
    WITHDRAW_HISTORY: "/broker/admin-wallet/withdraw-history",
    REPLENISH_BALANCES: "/broker/admin-wallet/replenish-balances",
  },
} as const;
