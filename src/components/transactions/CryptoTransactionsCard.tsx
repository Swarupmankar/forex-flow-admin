import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Bitcoin, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetCryptoTransactionsQuery } from "@/API/transactions.api";
import { usdFmt } from "./FxAmount";

interface CryptoTransactionsCardProps {
  /** Fixes the list to one direction; otherwise a filter is offered. */
  action?: "DEPOSIT" | "WITHDRAW";
  /** One client's transactions; hides the client column. */
  userId?: number | string;
  title?: string;
}

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  FAILED: "bg-red-100 text-red-700 hover:bg-red-100",
};

const coinFmt = (n: number | null, coin: string | null) =>
  n == null ? "—" : `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${coin ?? ""}`.trim();

const shortHash = (h: string) => (h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);

export function CryptoTransactionsCard({ action, userId, title }: CryptoTransactionsCardProps) {
  const [type, setType] = useState<"all" | "DEPOSIT" | "WITHDRAW">("all");
  const [status, setStatus] = useState<"all" | "PENDING" | "COMPLETED" | "FAILED">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGetCryptoTransactionsQuery({
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (t) =>
        (type === "all" || t.action === type) &&
        (status === "all" || t.status === status) &&
        (!q ||
          [t.name, t.email, t.coin, t.network, t.txHash, t.address]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)))
    );
  }, [data, type, status, search]);

  const showClient = !userId;
  const colSpan = showClient ? 9 : 8;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
            <Bitcoin className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title ?? "Crypto transactions (CoinsBuy)"}</CardTitle>
            <CardDescription>
              Paid on-chain and credited in USD at the rate CoinsBuy applied.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showClient && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Client, coin, hash…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-52 pl-8 text-sm"
              />
            </div>
          )}
          {!action && (
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="DEPOSIT">Deposits</SelectItem>
                <SelectItem value="WITHDRAW">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Date</TableHead>
                {showClient && <TableHead>Client</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Coin / Network</TableHead>
                <TableHead className="text-right">Coin amount</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead>Status / Tx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading crypto transactions…
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-destructive">
                    Couldn't load crypto transactions.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
                    No crypto transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(t.createdAt), "dd MMM yy, HH:mm")}
                    </TableCell>
                    {showClient && (
                      <TableCell>
                        <div className="font-medium">{t.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{t.email}</div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className={t.action === "DEPOSIT" ? "text-emerald-700" : "text-rose-700"}>
                        {t.action === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold">{t.coin ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{t.network ?? ""}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                      {coinFmt(t.coinAmount, t.coin)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">{usdFmt(t.usdAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs">
                      {/* Derived from the pair rather than appliedRate, whose
                          direction CoinsBuy does not state. */}
                      {t.coinAmount && t.coinAmount > 0
                        ? `1 ${t.coin ?? "coin"} = ${usdFmt(t.usdAmount / t.coinAmount)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                      {t.serviceFee != null && <div>Service {usdFmt(t.serviceFee)}</div>}
                      {t.networkFee != null && t.networkFee > 0 && (
                        <div>Network {coinFmt(t.networkFee, t.networkFeeCoin)}</div>
                      )}
                      {t.serviceFee == null && !(t.networkFee && t.networkFee > 0) && "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLE[t.status] ?? ""}>
                        {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                      </Badge>
                      {t.txHash && (
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground" title={t.txHash}>
                          {shortHash(t.txHash)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
