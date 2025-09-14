import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type { Transaction } from "@/pages/Wallet";

interface TransactionHistoryTableProps {
  transactions: Transaction[];
}

const truncate = (s?: string | null, len = 18) => {
  if (!s) return "—";
  if (s.length <= len) return s;
  return `${s.slice(0, Math.max(6, len - 8))}…${s.slice(-6)}`;
};

const NETWORK_META: Record<
  string,
  { label: string; explorer?: (tx: string) => string | null }
> = {
  trc100: {
    label: "TRON (TRC100)",
    explorer: (tx) => (tx ? `https://tronscan.org/#/transaction/${tx}` : null),
  },
  erc100: {
    label: "Ethereum (ERC100)",
    explorer: (tx) => (tx ? `https://etherscan.io/tx/${tx}` : null),
  },
  cryptocurrency: { label: "Cryptocurrency" },
};

export function TransactionHistoryTable({
  transactions,
}: TransactionHistoryTableProps) {
  const parseNumber = (v: any): number => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // display formatted currency using transaction type to choose sign/color
  const formatCurrencyByType = (rawAmount: any, type: string) => {
    const amt = parseNumber(rawAmount);
    const abs = Math.abs(amt);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs);

    // treat these types as "replenish" (incoming / positive)
    const replenishTypes = ["replenish", "deposit", "credit"];
    const isReplenish = replenishTypes.includes((type || "").toLowerCase());
    const sign = isReplenish ? "+" : "-";
    const colorClass = isReplenish ? "text-green-600" : "text-red-600";

    return (
      <span className={colorClass}>
        {sign}
        {formatted}
      </span>
    );
  };

  // show "Replenish" for incoming types (deposit, replenish, credit)
  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();

    if (["replenish", "deposit", "credit"].includes(t)) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Replenish
        </Badge>
      );
    }

    if (t === "withdrawal" || t === "withdraw") {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Withdrawal
        </Badge>
      );
    }

    switch (t) {
      case "broker_fee":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Broker Fee
          </Badge>
        );
      case "profit":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Profit
          </Badge>
        );
      case "commission":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Commission
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getWalletBadge = (wallet: string) => {
    switch (wallet) {
      case "principal":
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-200">
            Principal
          </Badge>
        );
      case "net_profit":
        return (
          <Badge variant="outline" className="text-green-700 border-green-200">
            Net Profit
          </Badge>
        );
      default:
        return <Badge variant="outline">{wallet}</Badge>;
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No transactions found matching your criteria.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance After</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((transaction) => {
              const dt =
                transaction.date instanceof Date
                  ? transaction.date
                  : new Date(transaction.date);

              const amountRaw = (transaction as any).amount ?? transaction.amount;
              const balanceAfterRaw =
                (transaction as any).balanceAfter ?? transaction.balanceAfter;

              const rawNetwork =
                (transaction as any).withdrawNetwork ??
                (transaction as any).network ??
                null;

              const walletAddress =
                (transaction as any).withdrawToCryptoAddress ??
                (transaction as any).withdraw_to_crypto_address ??
                null;

              const transactionId =
                (transaction as any).withdrawCryptoTx ??
                (transaction as any).withdraw_crypto_tx ??
                (transaction as any).tx ??
                null;

              const networkKey = rawNetwork
                ? String(rawNetwork).toLowerCase().replace(/\s+/g, "")
                : "";
              const meta =
                NETWORK_META[networkKey] ??
                NETWORK_META[rawNetwork?.toString().toLowerCase()] ??
                null;
              const networkLabel = meta ? meta.label : rawNetwork ?? "—";
              const explorerUrl =
                meta?.explorer && transactionId ? meta.explorer(transactionId) : null;

              return (
                <TableRow
                  key={transaction.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-foreground">
                        {Number.isFinite(dt.getTime())
                          ? format(dt, "MMM dd, yyyy")
                          : "—"}
                      </div>
                      <div className="text-muted-foreground">
                        {Number.isFinite(dt.getTime()) ? format(dt, "HH:mm") : "—"}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell>{getWalletBadge(transaction.wallet)}</TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">{networkLabel}</div>
                  </TableCell>

                  {/* Wallet Address */}
                  <TableCell>
                    {walletAddress ? (
                      <div title={walletAddress} className="max-w-[220px] truncate">
                        {truncate(walletAddress, 28)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Transaction ID */}
                  <TableCell>
                    {transactionId ? (
                      <div className="text-sm">
                        <div title={transactionId} className="max-w-[220px] truncate">
                          {truncate(transactionId, 28)}
                        </div>
                        {explorerUrl && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline mt-0.5 inline-block"
                          >
                            View on explorer
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {formatCurrencyByType(amountRaw, String(transaction.type))}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      }).format(parseNumber(balanceAfterRaw) ?? 0)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default TransactionHistoryTable;
