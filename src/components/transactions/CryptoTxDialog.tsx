import { format } from "date-fns";
import { Bitcoin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CryptoTransaction } from "@/features/transactions/transactions.types";
import { usdFmt } from "./FxAmount";

interface CryptoTxDialogProps {
  tx: CryptoTransaction | null;
  onClose: () => void;
}

const coin = (n: number | null, c: string | null) =>
  n == null ? "—" : `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${c ?? ""}`.trim();

const STATUS: Record<CryptoTransaction["status"], { label: string; cls: string }> = {
  PENDING: { label: "Processing", cls: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Failed", cls: "bg-red-100 text-red-700" },
};

/** A CoinsBuy deposit or withdrawal. Read-only: CoinsBuy settles these itself. */
export function CryptoTxDialog({ tx, onClose }: CryptoTxDialogProps) {
  if (!tx) return null;
  const isDeposit = tx.action === "DEPOSIT";
  const isIb = tx.kind === "IB";
  const rate = tx.coinAmount && tx.coinAmount > 0 ? tx.usdAmount / tx.coinAmount : null;

  const rows: [string, React.ReactNode][] = [
    ["Client", <><div className="font-medium">{tx.name || "—"}</div><div className="text-xs text-muted-foreground">{tx.email}</div></>],
    ["Coin / network", `${tx.coin ?? "—"}${tx.network ? ` · ${tx.network}` : ""}`],
    [isDeposit ? "Received on-chain" : "Sent on-chain", coin(tx.coinAmount, tx.coin)],
    ["Rate", rate != null ? `1 ${tx.coin ?? "coin"} = ${usdFmt(rate)}` : "—"],
    [isDeposit ? "Wallet credited" : "Wallet debited", <span className="font-semibold">{usdFmt(tx.usdAmount)}</span>],
    ...(tx.serviceFee != null ? [["Service fee", usdFmt(tx.serviceFee)] as [string, React.ReactNode]] : []),
    ...(tx.networkFee != null && tx.networkFee > 0
      ? [["Network fee", coin(tx.networkFee, tx.networkFeeCoin)] as [string, React.ReactNode]]
      : []),
    ...(tx.providerCommission != null && tx.providerCommission > 0
      ? [["CoinsBuy commission", coin(tx.providerCommission, tx.coin)] as [string, React.ReactNode]]
      : []),
    [isDeposit ? "From address" : "To address", tx.address ? <span className="break-all font-mono text-xs">{tx.address}</span> : "—"],
    ["Tx hash", tx.txHash ? <span className="break-all font-mono text-xs">{tx.txHash}</span> : "—"],
    ["Created", format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")],
    ["Last update", format(new Date(tx.updatedAt), "dd MMM yyyy, HH:mm")],
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-md bg-orange-100 p-1.5 text-orange-600"><Bitcoin className="h-4 w-4" /></span>
            {isIb ? "IB commission payout" : `Crypto ${isDeposit ? "deposit" : "withdrawal"}`} #{tx.id}
            {isIb && (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">IB</span>
            )}
            <Badge className={`ml-auto ${STATUS[tx.status].cls}`}>{STATUS[tx.status].label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {isIb
              ? "Paid from the IB's commission wallet by CoinsBuy. Nothing to approve here."
              : "Processed by CoinsBuy. Nothing to approve here."}
          </DialogDescription>
        </DialogHeader>
        <dl className="divide-y rounded-lg border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
