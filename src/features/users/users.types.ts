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
}

export interface Transaction {
  id: number;
  transactionType: "DEPOSIT" | "WITHDRAW";
  transactionStatus: "APPROVED" | "PENDING" | "REJECTED";
  mode: "BANK" | "UPI" | "CRYPTO";
  amount: string;
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
  accountSpread: number;
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
