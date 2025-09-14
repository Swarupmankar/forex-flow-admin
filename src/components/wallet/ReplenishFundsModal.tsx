// src/components/wallet/ReplenishFundsModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReplenishBalancesMutation } from "@/API/accounting.api";
import { useToast } from "@/components/ui/use-toast";

interface ReplenishFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (replenishData: {
    wallet: "principal" | "net_profit";
    amount: number;
  }) => void; // kept optional but NOT used
  onSuccess?: () => void;
  selectedWallet: "principal" | "net_profit" | null;
  currentBalances?: { principal: number; netProfit: number } | null;
}

export function ReplenishFundsModal({
  isOpen,
  onClose,
  onSuccess,
  selectedWallet,
  currentBalances,
}: ReplenishFundsModalProps) {
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [replenishBalances, { isLoading: isSubmitting, error: mutationError }] =
    useReplenishBalancesMutation();

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setErrors({});
      setServerError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mutationError) {
      const asAny: any = mutationError;
      const msg =
        (asAny?.data && (asAny.data.message || asAny.data.error)) ||
        asAny?.error ||
        JSON.stringify(asAny) ||
        "Server error";
      setServerError(String(msg));
    }
  }, [mutationError]);

  const currentBalance = useMemo(() => {
    if (!currentBalances || !selectedWallet) return 0;
    return selectedWallet === "principal"
      ? currentBalances.principal
      : currentBalances.netProfit;
  }, [currentBalances, selectedWallet]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const parsed = parseFloat(amount || "0");
    if (!selectedWallet)
      newErrors._global = "Please select a wallet before replenishing.";
    if (!currentBalances)
      newErrors._global =
        "Live wallet balances not loaded. Cannot submit replenish.";
    if (!amount || Number.isNaN(parsed) || parsed <= 0)
      newErrors.amount = "Please enter a valid amount greater than 0";
    setErrors(newErrors);
    console.log("[ReplenishModal] validate inputs:", {
      amount,
      parsedAmount: parsed,
      selectedWallet,
      currentBalances,
      errors: newErrors,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    const parsedAmount = Number(parseFloat(amount));
    const walletType: "PRINCIPAL_ACCOUNT" | "NET_PROFIT" =
      selectedWallet === "principal" ? "PRINCIPAL_ACCOUNT" : "NET_PROFIT";

    const payload = { amount: parsedAmount, walletType };

    console.log("[ReplenishModal] submit payload:", payload);

    try {
      const resp = await replenishBalances(payload).unwrap();
      console.log("[ReplenishModal] API response:", resp);
      setSuccessMessage("Replenishment submitted.");
      // Do NOT insert local optimistic transaction. Instead, notify parent to refetch canonical data:
      if (onSuccess) onSuccess();
      toast({
        title: "Replenishment successful",
        description: `Added $${parsedAmount} to ${selectedWallet}`,
      });
      // auto-close modal after a short delay so toast is visible
      setTimeout(() => onClose(), 400);
      setAmount("");
      setErrors({});
    } catch (err: any) {
      console.error("[ReplenishModal] submit error:", err);
      const msg =
        (err?.data && (err.data.message || err.data.error)) ||
        err?.message ||
        "Failed to submit replenish";
      setServerError(String(msg));
      toast({ title: "Replenishment failed", description: String(msg) });
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    !selectedWallet ||
    !currentBalances ||
    !amount ||
    Object.keys(errors).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Replenish Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {errors._global && (
            <Alert>
              <AlertDescription>{errors._global}</AlertDescription>
            </Alert>
          )}
          {serverError && (
            <Alert>
              <AlertDescription className="text-destructive">
                {serverError}
              </AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          <div>
            <div className="text-sm text-muted-foreground">Wallet</div>
            <div className="font-medium">
              {selectedWallet === "principal"
                ? "Principal Account"
                : selectedWallet === "net_profit"
                ? "Net Profit"
                : "—"}
              <span className="ml-2 text-sm text-muted-foreground">
                {currentBalances
                  ? `Balance: $${currentBalance.toLocaleString()}`
                  : ""}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="replenish-amount">Amount</Label>
              <Input
                id="replenish-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
                  if (errors._global) {
                    setErrors((p) => {
                      const c = { ...p };
                      delete c._global;
                      return c;
                    });
                  }
                }}
                disabled={isSubmitting}
              />
              {errors.amount && (
                <p className="text-sm text-destructive mt-1">{errors.amount}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? "Submitting…" : "Replenish Funds"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReplenishFundsModal;
