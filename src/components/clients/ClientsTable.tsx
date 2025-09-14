import { useState } from "react";
import { Eye, Ban, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client } from "@/features/users/users.types";

interface ClientsTableProps {
  clients: Client[];
  selectedClients: number[];
  onSelectClient: (clientId: number) => void;
  onSelectAll: (checked: boolean) => void;
  onViewClient: (client: Client) => void;
  // onBanClient: (clientId: string) => void;
}

export function ClientsTable({
  clients,
  selectedClients,
  onSelectClient,
  onSelectAll,
  onViewClient,
}: // onBanClient,
ClientsTableProps) {
  const allSelected =
    clients.length > 0 && selectedClients.length === clients.length;
  const someSelected =
    selectedClients.length > 0 && selectedClients.length < clients.length;

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success hover:bg-success/20">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="text-left p-4 w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className={
                    someSelected ? "data-[state=checked]:bg-primary/50" : ""
                  }
                />
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Client Name
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Email
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Account ID
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                KYC Status
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Wallet Balance
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Linked Accounts
              </th>
              <th className="text-left p-4 font-semibold text-foreground">
                Registration Date
              </th>
              <th className="text-left p-4 font-semibold text-foreground w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr
                key={client.id}
                className="border-b hover:bg-muted/20 transition-colors group"
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => onSelectClient(client.id)}
                  />
                </td>

                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {client.name}
                    </span>
                  </div>
                </td>

                <td className="p-4">
                  <span className="text-muted-foreground">{client.email}</span>
                </td>

                <td className="p-4">
                  <span className="font-mono text-sm text-foreground">
                    {client.accountId}
                  </span>
                </td>

                <td className="p-4">{getKycStatusBadge(client.kycStatus)}</td>

                <td className="p-4">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(client.walletBalance)}
                  </span>
                </td>

                <td className="p-4">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                    onClick={() => onViewClient(client)}
                  >
                    {client.linkedTradingAccounts} account
                    {client.linkedTradingAccounts !== 1 ? "s" : ""}
                  </Button>
                </td>

                <td className="p-4">
                  <span className="text-muted-foreground">
                    {formatDate(client.registrationDate)}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewClient(client)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => onViewClient(client)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          // onClick={() => onBanClient(client.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Ban className="h-4 w-4" />
                          Ban Client
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          // onClick={() => onBanClient(client.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No clients found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
