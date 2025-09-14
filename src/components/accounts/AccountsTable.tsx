import { Edit, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Account } from "@/pages/AccountsSpreads";
import { cn } from "@/lib/utils";

interface AccountsTableProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
}

export function AccountsTable({ accounts, onEditAccount }: AccountsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Account ID</TableHead>
              <TableHead className="font-semibold">Client Name</TableHead>
              <TableHead className="font-semibold">Account Type</TableHead>
              <TableHead className="font-semibold">Leverage</TableHead>
              <TableHead className="font-semibold">Balance</TableHead>
              <TableHead className="font-semibold">Spread Profile</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow 
                key={account.id} 
                className="hover:bg-accent/5 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium text-foreground">
                  {account.id}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={account.clientAvatar}
                      alt={account.clientName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-foreground">
                      {account.clientName}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    account.accountType === "Pro" && "bg-primary/10 text-primary",
                    account.accountType === "Raw Spread" && "bg-success/10 text-success",
                    account.accountType === "Standard" && "bg-muted text-muted-foreground"
                  )}>
                    {account.accountType}
                  </span>
                </TableCell>
                
                <TableCell className="text-foreground">
                  1:{account.leverage}
                </TableCell>
                
                <TableCell className="text-foreground font-medium">
                  {formatCurrency(account.balance)}
                </TableCell>
                
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {account.spreadProfile}
                  </Button>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={getStatusBadgeVariant(account.status)}
                    className={cn(
                      account.status === "Active" && "bg-success/10 text-success border-success/20",
                      account.status === "Disabled" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {account.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAccount(account)}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-warning/10 hover:text-warning"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {accounts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No accounts found matching your criteria.</p>
        </div>
      )}
    </Card>
  );
}