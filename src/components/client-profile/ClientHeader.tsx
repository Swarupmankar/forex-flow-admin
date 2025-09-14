import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Copy,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Shield,
} from "lucide-react";
import type { Client } from "@/features/users/users.types";

interface ClientHeaderProps {
  client: Client;
  onBack: () => void;
}

const statusBadge = (status: Client["kycStatus"]) => {
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

export function ClientHeader({ client, onBack }: ClientHeaderProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(client.registrationDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <header className="bg-gradient-to-br from-card via-card to-muted/20 border rounded-xl p-6 shadow-lg animate-fade-in">
      <div className="flex flex-col gap-6">
        {/* Main Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-16 w-16 shadow-md border-2 border-primary/20">
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/10 to-primary/20">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Status Indicator */}
              <div
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card shadow-sm ${
                  client.kycStatus === "approved"
                    ? "bg-success"
                    : client.kycStatus === "pending"
                    ? "bg-warning"
                    : "bg-destructive"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {client.name}
                </h1>
                {statusBadge(client.kycStatus)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Email:</span>
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Phone:</span>
                    <span>{client.phoneNumber}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Account ID:</span>
                    <span className="font-mono">{client.accountId}</span>
                  </div>
                  {client.referralCode && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Referral:</span>
                      <span className="font-mono">{client.referralCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="hover-scale"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(client.walletBalance)}
            </div>
            <div className="text-xs text-muted-foreground">Wallet Balance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {client.linkedAccounts}
            </div>
            <div className="text-xs text-muted-foreground">Active Accounts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {daysSinceJoined}
            </div>
            <div className="text-xs text-muted-foreground">Days Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-success">
              ${client.profit}
            </div>
            <div className="text-xs text-muted-foreground">Net Profit</div>
          </div>
        </div>
      </div>
    </header>
  );
}
