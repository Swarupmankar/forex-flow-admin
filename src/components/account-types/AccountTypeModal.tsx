import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AccountKind,
  AccountType,
} from "@/features/accountTypes/accountTypes.types";

// The number fields are held as the text in the input, so one can be cleared
// and retyped; parsing it on every keystroke turned an empty field back into 0.
// A whole number of 0 or more, or null if the text is not one.
const toWhole = (text: string): number | null =>
  /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;

interface AccountTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountType: Omit<AccountType, "id" | "createdAt">) => void;
  accountType?: AccountType | null;
}

export function AccountTypeModal({
  isOpen,
  onClose,
  onSave,
  accountType,
}: AccountTypeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minDeposit: "100",
    leverage: "100",
    commission: "0",
    takerFeed: "",
    accountType: "REAL" as AccountKind,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (accountType) {
      setFormData({
        name: accountType.name,
        description: accountType.description,
        minDeposit: String(accountType.minDeposit),
        leverage: String(accountType.leverage),
        commission: String(accountType.commission),
        takerFeed: accountType.takerFeed,
        accountType: accountType.accountType,
        isActive: accountType.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        minDeposit: "100",
        leverage: "100",
        commission: "0",
        takerFeed: "",
        accountType: "REAL",
        isActive: true,
      });
    }
    setErrors({});
  }, [accountType, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // 0 is allowed (e.g. a demo type with no minimum).
    if (toWhole(formData.minDeposit) === null) {
      newErrors.minDeposit = "Minimum deposit must be a whole number of 0 or more";
    }

    const leverage = toWhole(formData.leverage);
    if (leverage === null || leverage < 1) {
      newErrors.leverage = "Leverage must be a whole number of at least 1";
    }

    // 0 means no commission. The backend stores it as a whole number.
    if (toWhole(formData.commission) === null) {
      newErrors.commission = "Commission must be a whole number of 0 or more";
    }

    // Only on create: the feed cannot be changed afterwards. Same rule as the
    // backend, which also checks the feed exists on the price gateway.
    if (!accountType) {
      if (!formData.takerFeed) {
        newErrors.takerFeed = "Taker feed is required";
      } else if (!/^[A-Za-z0-9_-]+$/.test(formData.takerFeed)) {
        newErrors.takerFeed =
          'Use letters, digits, "_" and "-" only, with no spaces';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      ...formData,
      minDeposit: toWhole(formData.minDeposit) as number,
      leverage: toWhole(formData.leverage) as number,
      commission: toWhole(formData.commission) as number,
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {accountType ? "Edit Account Type" : "Create New Account Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">
              General Information
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Type Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Standard Account"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Brief description of this account type..."
                  rows={3}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Kind *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) =>
                    handleInputChange("accountType", value as AccountKind)
                  }
                >
                  <SelectTrigger id="accountType" className="w-full sm:w-48">
                    <SelectValue placeholder="Real or Demo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REAL">Real</SelectItem>
                    <SelectItem value="DEMO">Demo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {accountType
                    ? "Changes which kind of account can be opened on this type from now on. Accounts already open are not affected."
                    : "Only this kind of trading account can be opened on this type. Traders see Real types when opening a real account and Demo types for a demo one."}
                </p>
              </div>
            </div>
          </div>

          {/* Trading Conditions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">
              Trading Conditions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minDeposit">Minimum Deposit (USD) *</Label>
                <Input
                  id="minDeposit"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minDeposit}
                  onChange={(e) =>
                    handleInputChange("minDeposit", e.target.value)
                  }
                  className={errors.minDeposit ? "border-destructive" : ""}
                />
                {errors.minDeposit && (
                  <p className="text-sm text-destructive">
                    {errors.minDeposit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leverage">Leverage *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">1:</span>
                  <Input
                    id="leverage"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.leverage}
                    onChange={(e) =>
                      handleInputChange("leverage", e.target.value)
                    }
                    placeholder="e.g., 500"
                    className={errors.leverage ? "border-destructive" : ""}
                  />
                </div>
                {errors.leverage ? (
                  <p className="text-sm text-destructive">{errors.leverage}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {accountType
                      ? "Applies to every trading account on this type, including existing ones. Open positions keep their current margin."
                      : "Every trading account opened on this type gets this leverage. Traders cannot change it."}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Commission *</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.commission}
                  onChange={(e) =>
                    handleInputChange("commission", e.target.value)
                  }
                  placeholder="e.g., 7 (0 for no commission)"
                  className={errors.commission ? "border-destructive" : ""}
                />
                {errors.commission && (
                  <p className="text-sm text-destructive">
                    {errors.commission}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="takerFeed">Taker Feed *</Label>
                <Input
                  id="takerFeed"
                  value={formData.takerFeed}
                  onChange={(e) =>
                    handleInputChange("takerFeed", e.target.value.trim())
                  }
                  placeholder="e.g., PLAIN, STD, VIP"
                  disabled={!!accountType}
                  className={errors.takerFeed ? "border-destructive" : ""}
                />
                {errors.takerFeed ? (
                  <p className="text-sm text-destructive">{errors.takerFeed}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {accountType
                      ? "Fixed when the account type was created. To use another feed, create a new account type."
                      : "Must match a feed on the price gateway. It is saved as this type's key in the trading account token and cannot be changed later."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">
              Visibility
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Account Type Status</Label>
                <p className="text-sm text-muted-foreground">
                  Control whether this account type is available for new
                  accounts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {accountType ? "Update Account Type" : "Create Account Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
