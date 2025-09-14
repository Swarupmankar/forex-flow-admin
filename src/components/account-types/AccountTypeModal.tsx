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
import { AccountType } from "@/features/accountTypes/accountTypes.types";
import { useGetSpreadProfilesQuery } from "@/API/spreadProfilesApi";

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
  const { data: spreadProfilesData, isLoading: isProfilesLoading } =
    useGetSpreadProfilesQuery();

  const spreadProfiles =
    spreadProfilesData
      ?.filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        name: p.name,
      })) ?? [];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minDeposit: 100,
    commission: 0,
    spread: 0,
    spreadProfileId: 1,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (accountType) {
      setFormData({
        name: accountType.name,
        description: accountType.description,
        minDeposit: accountType.minDeposit,
        commission: accountType.commission,
        spread: accountType.spread,
        spreadProfileId: accountType.spreadProfileId,
        isActive: accountType.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        minDeposit: 100,
        commission: 0,
        spread: 0,
        spreadProfileId: 1,
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

    if (formData.minDeposit < 1) {
      newErrors.minDeposit = "Minimum deposit must be at least $1";
    }

    if (formData.commission < 0) {
      newErrors.commission = "Commission is required";
    }

    if (formData.spread < 0) {
      newErrors.spread = "Spread must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
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
                  min="1"
                  value={formData.minDeposit}
                  onChange={(e) =>
                    handleInputChange(
                      "minDeposit",
                      parseInt(e.target.value) || 0
                    )
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
                <Label htmlFor="commission">Commission *</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commission}
                  onChange={(e) =>
                    handleInputChange(
                      "commission",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="e.g., 0%, $7 per lot, 0.02%"
                  className={errors.commission ? "border-destructive" : ""}
                />
                {errors.commission && (
                  <p className="text-sm text-destructive">
                    {errors.commission}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Spread Profile *</Label>
                <Select
                  value={String(formData.spreadProfileId)}
                  onValueChange={(value) =>
                    handleInputChange("spreadProfileId", Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a spread profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {isProfilesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : spreadProfiles.length > 0 ? (
                      spreadProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={String(profile.id)}>
                          {profile.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No profiles available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spread">Spread *</Label>
                <Input
                  id="spread"
                  type="number"
                  step="0.01"
                  value={formData.spread}
                  onChange={(e) =>
                    handleInputChange("spread", parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g., 0%, $7 per lot, 0.02%"
                  className={errors.spread ? "border-destructive" : ""}
                />
                {errors.spread && (
                  <p className="text-sm text-destructive">{errors.spread}</p>
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
