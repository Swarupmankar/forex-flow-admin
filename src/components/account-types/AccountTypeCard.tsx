import { useState } from "react";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AccountType } from "@/features/accountTypes/accountTypes.types";

interface AccountTypeCardProps {
  accountType: AccountType;
  onEdit: (accountType: AccountType) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export function AccountTypeCard({
  accountType,
  onEdit,
  onDelete,
  onToggleStatus,
}: AccountTypeCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    onDelete(accountType.id);
    setShowDeleteDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card className="group relative hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground leading-tight">
                {accountType.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {accountType.description}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-2">
              <Badge variant={accountType.isActive ? "default" : "secondary"}>
                {accountType.isActive ? "Active" : "Inactive"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(accountType)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Min Deposit</div>
              <div className="font-semibold text-foreground">
                {formatCurrency(accountType.minDeposit)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Commission</div>
              <div className="font-semibold text-foreground">
                {accountType.commission}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Spreads</div>
              <div className="font-semibold text-foreground text-xs">
                {accountType.spread}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Spread Profile</div>
              <div className="font-semibold text-foreground text-xs">
                {accountType.spreadProfileName ||
                  `Profile #${accountType.spreadProfileId}`}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">
                {accountType.isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={accountType.isActive}
                onCheckedChange={() => onToggleStatus(accountType.id)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{accountType.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
