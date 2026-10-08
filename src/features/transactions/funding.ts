import type { CryptoTransaction, Transaction } from "./transactions.types";

/**
 * One deposit or withdrawal, whichever rail it came through, so bank / UPI
 * requests and CoinsBuy crypto can share one table, one set of filters and
 * one sort. Bank / UPI rows are approved by the broker; CoinsBuy rows settle
 * on their own and are view-only.
 */

export type FundingMethod = "upi" | "bank" | "crypto";
export type FundingStatus = "pending" | "approved" | "rejected";
export type FundingDirection = "deposit" | "withdraw";

export interface FundingRow {
  key: string;
  source: "manual" | "coinsbuy";
  id: number;
  direction: FundingDirection;
  method: FundingMethod;
  status: FundingStatus;
  clientName: string;
  email: string;
  /** USD credited or debited. */
  usd: number;
  inrAmount: number | null;
  fxRate: number | null;
  createdAt: string;
  /** UTR / bank reference, or the crypto tx hash. */
  reference: string | null;
  /** Where a withdrawal goes: bank account, UPI ID or crypto address. */
  destination: string | null;
  /** An IB paying out commission: a CoinsBuy payout from the IB wallet, or a legacy bank / UPI commission withdrawal. */
  isIb: boolean;
  manual?: Transaction;
  crypto?: CryptoTransaction;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const fromManual = (t: Transaction): FundingRow => {
  const s = (t.transactionStatus ?? "").toString().toUpperCase();
  const mode = (t.mode ?? "").toString().toUpperCase();
  return {
    key: `m-${t.id}`,
    source: "manual",
    id: t.id,
    direction: t.transactionType === "DEPOSIT" ? "deposit" : "withdraw",
    method: mode === "UPI" ? "upi" : mode === "CRYPTO" ? "crypto" : "bank",
    status: s === "PENDING" ? "pending" : s === "REJECTED" ? "rejected" : "approved",
    clientName: t.name || `User ${t.userId ?? t.id}`,
    email: t.email ?? "",
    usd: Math.abs(Number(t.amount ?? 0)),
    inrAmount: toNum(t.inrAmount),
    fxRate: toNum(t.fxRate),
    createdAt: t.createdAt,
    reference: t.utrNo ?? null,
    destination: t.upiId ?? t.bankAccountNo ?? t.cryptoAddress ?? null,
    isIb:
      typeof t.accountIdentifier === "string" &&
      t.accountIdentifier.toUpperCase().startsWith("COMMISSION"),
    manual: t,
  };
};

export const fromCrypto = (c: CryptoTransaction): FundingRow => ({
  key: `c-${c.id}`,
  source: "coinsbuy",
  id: c.id,
  direction: c.action === "DEPOSIT" ? "deposit" : "withdraw",
  method: "crypto",
  status: c.status === "PENDING" ? "pending" : c.status === "FAILED" ? "rejected" : "approved",
  clientName: c.name || `User ${c.userId}`,
  email: c.email ?? "",
  usd: c.usdAmount,
  inrAmount: null,
  fxRate: null,
  createdAt: c.createdAt,
  reference: c.txHash,
  destination: c.address,
  isIb: c.kind === "IB",
  crypto: c,
});

export type FundingSort = "newest" | "oldest" | "largest" | "smallest";

export interface FundingFilters {
  search: string;
  /** "ib" is not a payment method: it narrows to IB commission payouts, whatever the rail. */
  method: "all" | "ib" | FundingMethod;
  status: "all" | FundingStatus;
  direction: "all" | FundingDirection;
  sort: FundingSort;
}

export const DEFAULT_FUNDING_FILTERS: FundingFilters = {
  search: "",
  method: "all",
  status: "all",
  direction: "all",
  sort: "newest",
};

/** Everything but the method filter, so the method chips can count what each would show. */
export const applyFundingFilters = (
  rows: FundingRow[],
  f: FundingFilters,
  { skipMethod = false }: { skipMethod?: boolean } = {}
) => {
  const q = f.search.trim().toLowerCase();
  const out = rows.filter(
    (r) =>
      (skipMethod || f.method === "all" || (f.method === "ib" ? r.isIb : r.method === f.method)) &&
      (f.status === "all" || r.status === f.status) &&
      (f.direction === "all" || r.direction === f.direction) &&
      (!q ||
        [r.clientName, r.email, String(r.id), r.reference, r.destination, r.crypto?.coin]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)))
  );
  const time = (r: FundingRow) => new Date(r.createdAt).getTime() || 0;
  const by: Record<FundingSort, (a: FundingRow, b: FundingRow) => number> = {
    newest: (a, b) => time(b) - time(a),
    oldest: (a, b) => time(a) - time(b),
    largest: (a, b) => b.usd - a.usd,
    smallest: (a, b) => a.usd - b.usd,
  };
  return out.sort(by[f.sort]);
};
