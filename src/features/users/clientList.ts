/**
 * The Clients page's row: one client with the money and account figures the
 * users list returns, plus the filters and sorts the page offers over them.
 */

/** One row of GET /broker/user-management/users. */
export interface ClientListItemApi {
  name: string;
  email: string;
  phoneNumber?: string | null;
  accountId: number;
  isActive?: boolean;
  kycStatus: string;
  walletBalance: string | number;
  cryptoBalance?: string | number;
  linkedTradingAccounts: number;
  activeTradingAccounts?: number;
  tradingBalance?: number;
  accountTypes?: string[];
  totalDeposits?: number;
  totalWithdrawals?: number;
  registrationDate: string;
}

export type KycFilter = "approved" | "pending" | "rejected";

export interface ClientRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  kycStatus: KycFilter;
  walletBalance: number;
  cryptoBalance: number;
  tradingBalance: number;
  /** Wallet + crypto wallet + real trading accounts. */
  totalBalance: number;
  accounts: number;
  activeAccounts: number;
  accountTypes: string[];
  totalDeposits: number;
  totalWithdrawals: number;
  /** Deposits minus withdrawals. */
  netDeposits: number;
  registeredAt: string;
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const toClientRow = (u: ClientListItemApi): ClientRow => {
  const k = (u.kycStatus ?? "").toUpperCase();
  const wallet = n(u.walletBalance);
  const crypto = n(u.cryptoBalance);
  const trading = n(u.tradingBalance);
  const deposits = n(u.totalDeposits);
  const withdrawals = n(u.totalWithdrawals);
  return {
    id: u.accountId,
    name: u.name || `User ${u.accountId}`,
    email: u.email,
    phone: u.phoneNumber ?? null,
    isActive: u.isActive ?? true,
    kycStatus: k === "APPROVED" ? "approved" : k === "REJECTED" ? "rejected" : "pending",
    walletBalance: wallet,
    cryptoBalance: crypto,
    tradingBalance: trading,
    totalBalance: wallet + crypto + trading,
    accounts: n(u.linkedTradingAccounts),
    activeAccounts: n(u.activeTradingAccounts),
    accountTypes: u.accountTypes ?? [],
    totalDeposits: deposits,
    totalWithdrawals: withdrawals,
    netDeposits: deposits - withdrawals,
    registeredAt: u.registrationDate,
  };
};

export type ClientSort =
  | "newest"
  | "oldest"
  | "name"
  | "accounts"
  | "balance"
  | "deposits"
  | "withdrawals"
  | "net";

export const CLIENT_SORT_LABEL: Record<ClientSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name (A–Z)",
  accounts: "Most trading accounts",
  balance: "Highest balance",
  deposits: "Most deposited",
  withdrawals: "Most withdrawn",
  net: "Highest net deposit",
};

export type RegisteredFilter = "all" | "today" | "7d" | "30d" | "90d" | "year";

export interface ClientFilters {
  search: string;
  kyc: "all" | KycFilter;
  registered: RegisteredFilter;
  /** An account type name, "none" for clients without a trading account. */
  accountType: string;
  funded: "all" | "funded" | "unfunded";
  status: "all" | "active" | "disabled";
  sort: ClientSort;
}

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: "",
  kyc: "all",
  registered: "all",
  accountType: "all",
  funded: "all",
  status: "all",
  sort: "newest",
};

const registeredSince = (r: RegisteredFilter): number | null => {
  const now = new Date();
  switch (r) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    case "7d":
      return now.getTime() - 7 * 86_400_000;
    case "30d":
      return now.getTime() - 30 * 86_400_000;
    case "90d":
      return now.getTime() - 90 * 86_400_000;
    case "year":
      return new Date(now.getFullYear(), 0, 1).getTime();
    default:
      return null;
  }
};

export const applyClientFilters = (rows: ClientRow[], f: ClientFilters): ClientRow[] => {
  const q = f.search.trim().toLowerCase();
  const since = registeredSince(f.registered);
  const out = rows.filter(
    (c) =>
      (!q ||
        [c.name, c.email, c.phone, String(c.id)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))) &&
      (f.kyc === "all" || c.kycStatus === f.kyc) &&
      (since === null || new Date(c.registeredAt).getTime() >= since) &&
      (f.accountType === "all" ||
        (f.accountType === "none" ? c.accounts === 0 : c.accountTypes.includes(f.accountType))) &&
      (f.funded === "all" || (f.funded === "funded" ? c.totalDeposits > 0 : c.totalDeposits <= 0)) &&
      (f.status === "all" || (f.status === "active" ? c.isActive : !c.isActive))
  );
  const t = (c: ClientRow) => new Date(c.registeredAt).getTime() || 0;
  const by: Record<ClientSort, (a: ClientRow, b: ClientRow) => number> = {
    newest: (a, b) => t(b) - t(a),
    oldest: (a, b) => t(a) - t(b),
    name: (a, b) => a.name.localeCompare(b.name),
    accounts: (a, b) => b.accounts - a.accounts,
    balance: (a, b) => b.totalBalance - a.totalBalance,
    deposits: (a, b) => b.totalDeposits - a.totalDeposits,
    withdrawals: (a, b) => b.totalWithdrawals - a.totalWithdrawals,
    net: (a, b) => b.netDeposits - a.netDeposits,
  };
  return out.sort(by[f.sort]);
};

/** One-click views over the filters above. */
export const CLIENT_PRESETS: { key: string; label: string; apply: Partial<ClientFilters> }[] = [
  { key: "deposits", label: "Top depositors", apply: { sort: "deposits", funded: "funded" } },
  { key: "withdrawals", label: "Top withdrawals", apply: { sort: "withdrawals" } },
  { key: "accounts", label: "Most accounts", apply: { sort: "accounts" } },
  { key: "balance", label: "Highest balance", apply: { sort: "balance" } },
  { key: "kyc", label: "KYC pending", apply: { kyc: "pending" } },
  { key: "unfunded", label: "Never deposited", apply: { funded: "unfunded" } },
  { key: "new", label: "Joined this month", apply: { registered: "30d", sort: "newest" } },
];
