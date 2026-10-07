export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export interface CustomMessageItem {
  id: number | string;
  title?: string;
  message: string;
  sentBy?: string;
  date?: string; // ISO string
  type?: "SECURITY" | "UPDATE" | "PROMOTION" | "ALERT" | "MAINTENANCE";
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomMessagePayload = {
  userId: number; // or string if your backend expects string
  title: string;
  message: string;
  type: "SECURITY" | "UPDATE" | "PROMOTION" | "ALERT" | "MAINTENANCE";
};

export interface Client {
  linkedAccounts: number;
  id: number;
  name: string;
  email: string;
  accountId: number | string;
  phoneNumber?: number;
  referralCode?: string;
  kycStatus: KycStatus;
  walletBalance: number;
  linkedTradingAccounts: number;
  registrationDate: string;
  daysActiveFromRegistration?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  profit: string;
  totalCommission?: number | null;
  totalLots?: number | null;
  ibClients?: number | null;
  ibTier?: string | null;

  accounts: {
    type: string;
    leverage: string; // e.g. "1:500"
    balance: number;
    status: "active" | "archive";
    accountId?: string;
    accountType: "real" | "demo";
    server?: string;
    lastActivity?: string;
  }[];

  // 🔹 mapped from Transaction
  transactions?: {
    id: number;
    type: "deposit" | "withdrawal";
    amount: number;
    inrAmount?: number | null;
    fxRate?: number | null;
    date: string;
    method: string;
    status: "approved" | "pending" | "rejected";
    account: string;
  }[];
  totalDeposit?: string;
  totalWithdraw?: string;
  kycDocuments?: any;
  customMessages?: CustomMessageItem[];
}

export interface UserListResponse {
  results: Client[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface ListUsersQueryArgs {
  page?: number;
  limit?: number;
}

export interface UserDetailsResponse {
  name: string;
  email: string;
  accountId: number;
  phoneNumber: number;
  referralCode: string;
  walletBalance: string;
  totalActiveTradingAccounts: number;
  daysActiveFromRegistration: number;
  totalDeposits: string;
  totalWithdrawals: string;
  kycStatus: KycStatus;
  registrationDate: string;
  netProfit: string;
  /** Commission charged on this client's orders (sum of brokeragePaid). */
  totalCommission?: string;
  /** Lots traded on real accounts. */
  totalLots?: string;
  /** Clients this user referred, as an IB, and the IB tier in force. */
  ibClients?: number;
  ibTier?: string | null;
}

export interface UserDetails {
  name: string;
  email: string;
  accountId: number;
  phoneNumber: number;
  referralCode: string;
  walletBalance: number;
  totalActiveTradingAccounts: number;
  daysActiveFromRegistration: number;
  totalDeposits: number;
  totalWithdrawals: number;
  kycStatus: KycStatus;
  registrationDate: string;
  netProfit: string;
  /** Null when the backend did not send it. */
  totalCommission: number | null;
  /** Null when the backend did not send it. */
  totalLots: number | null;
  ibClients: number | null;
  ibTier: string | null;
}

export interface Transaction {
  id: number;
  transactionType: "DEPOSIT" | "WITHDRAW";
  transactionStatus: "APPROVED" | "PENDING" | "REJECTED";
  mode: "BANK" | "UPI" | "CRYPTO";
  amount: string;
  inrAmount?: string | null;
  fxRate?: string | null;
  upiId?: string | null;
  utrNo?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  cryptoAddress?: string | null;
  cryptoNetwork?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserTransactionsResponse {
  totalDepositAmount: string;
  totalDepositCount: number;
  totalWithdrawAmount: string;
  totalWithdrawCount: number;
  transactions: Transaction[];
}

export interface TradingAccount {
  id: number;
  userId: number;
  accountTypesId: number;
  tradingUsername: string;
  nickname: string;
  accountType: "REAL" | "DEMO";
  accountStatus: "ACTIVE" | "INACTIVE";
  serverId: number;
  leverage: number;
  baseCurrency: string;
  fundsAvailable: string;
  createdAt: string;
  updatedAt: string;
  accountTypes?: {
    id?: number;
    name?: string;
  };
  pnl?: string;
  marginUsed?: string;
}

export interface TradingAccountsResponse {
  totalBalance: string;
  activeAccounts: number;
  avgLeverage: string;
  allTradingAccounts: TradingAccount[];
}

/* ---------- One trading account's trades ---------- */

export type TradeStatusFilter = "all" | "open" | "closed" | "pending" | "cancelled";

export interface AccountTrade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  status: string;
  executionType: string | null;
  /** Size the order opened with. */
  lots: number;
  /** Size still open after partial closes. */
  openLots: number;
  contractSize: number;
  entryPrice: number | null;
  /** Size-weighted average over the exits; null while nothing has closed. */
  exitPrice: number | null;
  sl: number | null;
  tp: number | null;
  /** Realised P&L, written on close. Null while open. */
  pnl: number | null;
  commission: number;
  margin: number;
  openedAt: string;
  closedAt: string | null;
  closeReason: string | null;
}

export interface AccountTradesSummary {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  pendingTrades: number;
  cancelledTrades: number;
  totalLots: number;
  realisedPnl: number;
  totalCommission: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
  buy: { trades: number; lots: number };
  sell: { trades: number; lots: number };
  symbols: { symbol: string; trades: number; lots: number; pnl: number }[];
}

export interface AccountTradesResponse {
  account: { id: number; tradingUsername: string };
  summary: AccountTradesSummary;
  trades: AccountTrade[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** One month of an IB's commission, YYYY-MM in the IB programme's timezone. */
export interface IbMonth {
  month: string;
  commission: number;
  lots: number;
  trades: number;
  activeClients: number;
  withdrawn: number;
}

export interface IbPeriod {
  month: string;
  commission: number;
  lots: number;
  trades: number;
  clients: number;
}

/** A client this user referred, and what they traded and earned the IB. */
export interface IbReferredClient {
  userId: number;
  name: string;
  email: string;
  joinedAt: string;
  referredAt: string;
  isActive: boolean;
  kycStatus: string;
  accounts: number;
  accountTypes: string[];
  /** Every filled order on real accounts, open or closed. */
  tradedLots: number;
  trades: number;
  /** Closed lots that went through the IB ledger. */
  commissionLots: number;
  commission: number;
  thisMonthLots: number;
  thisMonthCommission: number;
  lastMonthLots: number;
  lastMonthCommission: number;
  lastTradeAt: string | null;
}

export interface IbLedgerEntry {
  id: number;
  clientUserId: number | null;
  clientName: string | null;
  symbol: string;
  accountType: string;
  lots: number;
  rate: number;
  amount: number;
  state: "PENDING" | "CONFIRMED" | "PAID";
  closedAt: string;
}

export interface IbWithdrawal {
  id: number;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  coin: string | null;
  network: string | null;
  address: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface IbOverviewResponse {
  referralCode: string | null;
  tier: string | null;
  tierSince: string | null;
  tierSource: "AUTOMATIC_UPGRADE" | "AUTOMATIC_DOWNGRADE" | "MANUAL_ADMIN" | null;
  tierLevel: number | null;
  tierRequirements: { minVolumeLots: number; minActiveTraders: number } | null;
  /** Failed the tier's thresholds at an evaluation and not demoted yet. */
  risk: { since: string; failedEvaluations: number; graceCycles: number | null } | null;
  payoutHold: boolean;
  isSuspended: boolean;
  timezone: string;
  summary: {
    totalClients: number;
    activeClients: number;
    tradedLots: number;
    commissionLots: number;
    totalCommission: number;
    pendingCommission: number;
    confirmedCommission: number;
    paidCommission: number;
    withdrawn: number;
    pendingWithdrawal: number;
    walletBalance: number;
    thisMonth: IbPeriod;
    lastMonth: IbPeriod;
  };
  monthly: IbMonth[];
  bySymbol: { symbol: string; commission: number; lots: number; trades: number }[];
  clients: IbReferredClient[];
  ledger: IbLedgerEntry[];
  withdrawals: IbWithdrawal[];
}
