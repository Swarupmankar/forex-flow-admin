import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { TradingAccount } from "@/features/users/users.types";

interface AccountDetailModalProps {
  account: TradingAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDetailModal({
  account,
  isOpen,
  onClose,
}: AccountDetailModalProps) {
  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const copyToClipboard = async (
    text: string | number | undefined,
    label: string
  ) => {
    if (text === undefined || text === null) {
      toast.error(`No ${label} to copy`);
      return;
    }
    try {
      await navigator.clipboard.writeText(String(text));
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!account) return null;

  const acct = account as TradingAccount & {
    // optional extras returned by API (present in sample)
    pnl?: string; // e.g. "0"
    marginUsed?: string; // e.g. "800"
    accountTypes?: { name?: string }; // object with name: "Basic"
  };

  const fundsAvailable = Number(account.fundsAvailable ?? 0);
  const pnl = Number(account.pnl ?? 0);
  const marginUsed = Number(account.marginUsed ?? 0);

  // Calculations
  const equity = fundsAvailable + pnl;
  const freeMargin = equity - marginUsed;
  const denom = fundsAvailable !== 0 ? fundsAvailable : Math.abs(equity) || 1;
  const unrealizedPnLPercent = (pnl / denom) * 100;
  const leverageValue = Number(account.leverage ?? 1);
  const maxLeverage = leverageValue * 4;

  const readableAccountType = account.accountTypes?.name ?? account.accountType;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <DialogTitle className="text-xl font-semibold">
              Account Details
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete information for your trading account
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground">
                Account Name
              </label>
              <p className="text-lg font-medium">{acct.nickname}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Login ID</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-mono">
                  #{acct.tradingUsername}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(acct.tradingUsername, "Login ID")
                  }
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Current Leverage
              </label>
              <p className="text-lg font-medium">1:{leverageValue}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Balance</label>
              <p className="text-lg font-medium">{currency(fundsAvailable)}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Free Margin
              </label>
              <p className="text-lg font-medium">{currency(freeMargin)}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground">
                Account Type
              </label>
              <p className="text-lg font-medium capitalize">
                {readableAccountType}
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Server Name
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-medium">
                  {Number(account.serverId ?? "—")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(account.serverId, "Server Name")
                  }
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Max Leverage
              </label>
              <p className="text-lg font-medium">1:{maxLeverage}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Equity</label>
              <p className="text-lg font-medium">{currency(equity)}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Unrealized P&L
              </label>
              <p
                className={`text-lg font-medium ${
                  pnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {currency(pnl)} ({pnl >= 0 ? "+" : ""}
                {unrealizedPnLPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
