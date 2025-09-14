// src/components/wallet/WithdrawFundsModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWithdrawBalancesMutation } from "@/API/accounting.api";
import { WithdrawPayload } from "@/features/adminWallet/accounting.types";
import { useToast } from "@/components/ui/use-toast";

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    wallet: "principal" | "net_profit";
    amount: number;
    method: string;
    destination: string;
    withdrawNetwork?: string | null;
    withdrawToCryptoAddress?: string | null;
    withdrawCryptoTx?: string | null;
  }) => void;
  onSuccess?: () => void;
  selectedWallet?: "principal" | "net_profit" | null;
  availableBalances?: { principal: number; netProfit: number } | null;
}

const NETWORK_OPTIONS = [
  { value: "TRC100", label: "Cryptocurrency (TRC100)" },
  { value: "ERC100", label: "Cryptocurrency (ERC100)" },
];

export function WithdrawFundsModal({
  isOpen,
  onClose,
  onSuccess,
  selectedWallet,
  availableBalances,
}: WithdrawFundsModalProps) {
  const [wallet, setWallet] = useState<"principal" | "net_profit">(
    selectedWallet ?? "principal"
  );
  const [amount, setAmount] = useState<string>("");
  const [network, setNetwork] = useState<string>(
    NETWORK_OPTIONS[0]?.value ?? ""
  );
  const [address, setAddress] = useState<string>("");
  const [txId, setTxId] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [withdrawBalances, { isLoading: isSubmitting, error: mutationError }] =
    useWithdrawBalancesMutation();

  useEffect(() => {
    if (selectedWallet) setWallet(selectedWallet);
  }, [selectedWallet]);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setNetwork(NETWORK_OPTIONS[0]?.value ?? "");
      setAddress("");
      setTxId("");
      setErrors({});
      setServerError(null);
    }
  }, [isOpen]);

  const isCryptoNetwork = useMemo(() => {
    const v = (network ?? "").toLowerCase();
    return v.includes("trc") || v.includes("erc") || v.includes("crypto");
  }, [network]);

  const maxAvailable = useMemo(() => {
    if (!availableBalances) return Infinity;
    return wallet === "principal"
      ? availableBalances.principal
      : availableBalances.netProfit;
  }, [availableBalances, wallet]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const amt = Number(parseFloat(amount || "0"));

    if (!availableBalances)
      newErrors._global = "Live balances not loaded. Cannot submit withdrawal.";
    if (!amount || Number.isNaN(amt) || amt <= 0)
      newErrors.amount = "Enter a valid amount greater than 0.";
    else if (amt > maxAvailable)
      newErrors.amount = `Amount exceeds available balance (${maxAvailable}).`;
    if (!network) newErrors.network = "Please select a network.";
    if (isCryptoNetwork) {
      if (!address.trim())
        newErrors.address =
          "Crypto address is required for crypto withdrawals.";
      if (!txId.trim())
        newErrors.txId = "Transaction ID is required for crypto withdrawals.";
    }

    setErrors(newErrors);
    console.log("[WithdrawModal] validate inputs:", {
      amount,
      parsedAmount: Number(parseFloat(amount || "0")),
      wallet,
      network,
      address,
      txId,
      availableBalances,
      errors: newErrors,
    });

    return Object.keys(newErrors).length === 0;
  };

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

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);
  };

  const handleSubmit = async () => {
    setServerError(null);

    if (!validate()) {
      console.warn("[WithdrawModal] validation failed");
      return;
    }

    const walletType =
      wallet === "principal" ? "PRINCIPAL_ACCOUNT" : "NET_PROFIT";

    const payload: WithdrawPayload = {
      amount: Number(parseFloat(amount)),
      walletType,
      withdrawNetwork: network,
      withdrawToCryptoAddress: address.trim(),
      withdrawCryptoTx: txId.trim(),
    };

    try {
      const resp = await withdrawBalances(payload).unwrap();
      console.log("[WithdrawModal] API response:", resp);
      toast({
        title: "Withdrawal submitted",
        description: `Requested ${formatCurrency(
          Number(payload.amount)
        )} withdrawal.`,
      });
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      const msg =
        (err?.data && (err.data.message || err.data.error)) ||
        err?.message ||
        "Failed to submit withdrawal";
      setServerError(String(msg));
      toast({ title: "Withdrawal failed", description: String(msg) });
    }
  };

  const isSubmitDisabled = isSubmitting || !availableBalances;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Withdraw Funds
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

          <div>
            <Label>Wallet</Label>
            <div className="text-sm">
              <strong>
                {wallet === "principal" ? "Principal Account" : "Net Profit"}
              </strong>{" "}
              <span className="text-muted-foreground ml-2">
                {availableBalances
                  ? `Available: ${formatCurrency(maxAvailable)}`
                  : "Available: N/A"}
              </span>
            </div>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
              }}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <Label>Network</Label>
            <Select
              value={network}
              onValueChange={(v) => {
                setNetwork(v);
                if (errors.network) setErrors((p) => ({ ...p, network: "" }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.network && (
              <p className="text-sm text-destructive mt-1">{errors.network}</p>
            )}
          </div>

          <div>
            <Label>
              {isCryptoNetwork
                ? "Wallet Address (required)"
                : "Destination (optional)"}
            </Label>
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((p) => ({ ...p, address: "" }));
              }}
              placeholder={
                isCryptoNetwork
                  ? "Enter wallet address"
                  : "Optional destination or reference"
              }
              disabled={isSubmitting}
            />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <Label>
              {isCryptoNetwork
                ? "Transaction ID (required)"
                : "Transaction ID (optional)"}
            </Label>
            <Input
              value={txId}
              onChange={(e) => {
                setTxId(e.target.value);
                if (errors.txId) setErrors((p) => ({ ...p, txId: "" }));
              }}
              placeholder="Blockchain transaction id"
              disabled={isSubmitting}
            />
            {errors.txId && (
              <p className="text-sm text-destructive mt-1">{errors.txId}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled || Object.keys(errors).length > 0}
          >
            {isSubmitting ? "Submitting…" : "Submit Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WithdrawFundsModal;
