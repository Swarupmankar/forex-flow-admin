import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CalendarDays,
  Gift,
  Hash,
  Layers,
  Mail,
  Network,
  Percent,
  Phone,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Client } from "@/features/users/users.types";

interface ClientHeaderProps {
  client: Client;
  onBack: () => void;
}

const KYC_STYLE: Record<string, { label: string; badge: string; dot: string }> = {
  // Solid tints with a border: the theme's 10% tints vanish against the
  // header's gradient.
  approved: {
    label: "KYC Approved",
    badge: "border border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "KYC Pending",
    badge: "border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100",
    dot: "bg-amber-500",
  },
  rejected: {
    label: "KYC Rejected",
    badge: "border border-red-300 bg-red-100 text-red-800 hover:bg-red-100",
    dot: "bg-red-500",
  },
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function InfoChip({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background/60 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`truncate text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function ClientHeader({ client, onBack }: ClientHeaderProps) {
  const initials =
    client.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?";

  const joined = client.registrationDate ? new Date(client.registrationDate) : null;
  const hasJoined = joined !== null && !isNaN(joined.getTime());
  const daysSinceJoined = hasJoined
    ? Math.max(0, Math.floor((Date.now() - joined.getTime()) / 86_400_000))
    : null;

  const kyc = KYC_STYLE[client.kycStatus] ?? {
    label: "KYC Unknown",
    badge: "",
    dot: "bg-muted-foreground",
  };

  const commission = client.totalCommission;

  const stats: {
    label: string;
    value: string;
    /** A second, smaller line under the value. */
    hint?: string;
    icon: LucideIcon;
    tone: string;
    valueClass?: string;
    highlight?: boolean;
  }[] = [
    // Wallet balance is not here: the summary cards below the header show it.
    {
      label: "Active Accounts",
      value: String(client.linkedAccounts ?? 0),
      icon: Layers,
      tone: "bg-purple-100 text-purple-600",
    },
    {
      label: "Days Active",
      value: daysSinceJoined !== null ? String(daysSinceJoined) : "—",
      icon: CalendarDays,
      tone: "bg-amber-100 text-amber-600",
    },
    // Net profit is in the summary cards below; this slot is the client as an IB.
    {
      label: "IB Clients",
      value: client.ibClients !== null && client.ibClients !== undefined ? String(client.ibClients) : "—",
      hint: client.ibTier ? `Tier: ${client.ibTier}` : client.ibClients === 0 ? "Not an IB" : undefined,
      icon: Network,
      tone: "bg-violet-100 text-violet-600",
    },
    {
      label: "Commission Generated",
      value: commission !== null && commission !== undefined ? usd(commission) : "—",
      icon: Percent,
      tone: "bg-primary/15 text-primary",
      valueClass: "text-primary",
      highlight: true,
    },
    {
      label: "Total Volume Traded",
      value:
        client.totalLots !== null && client.totalLots !== undefined
          ? `${client.totalLots.toLocaleString("en-US", { maximumFractionDigits: 2 })} lots`
          : "—",
      icon: BarChart3,
      tone: "bg-sky-100 text-sky-600",
    },
  ];

  return (
    <header className="overflow-hidden rounded-xl border bg-card shadow-sm animate-fade-in">
      {/* Banner */}
      <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

      <div className="-mt-10 space-y-6 px-6 pb-6">
        {/* Identity */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card ${kyc.dot}`}
                title={kyc.label}
              />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                <Badge className={kyc.badge}>{kyc.label}</Badge>
              </div>
              {hasJoined && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Client since {format(joined, "MMMM yyyy")} ·{" "}
                  {formatDistanceToNow(joined, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onBack} className="w-fit">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to clients
          </Button>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoChip
            icon={Hash}
            label="Account ID"
            value={`#${client.accountId}`}
            mono
          />
          <InfoChip
            icon={Mail}
            label="Email"
            value={client.email}
          />
          <InfoChip icon={Phone} label="Phone" value={client.phoneNumber || "—"} />
          <InfoChip
            icon={CalendarDays}
            label="Joined"
            value={hasJoined ? format(joined, "dd MMM yyyy, HH:mm") : "—"}
          />
          {client.referralCode && (
            <InfoChip
              icon={Gift}
              label="Referral Code"
              value={client.referralCode}
              mono
            />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-4 ${
                s.highlight ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${s.tone}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className={`mt-3 text-xl font-bold tracking-tight ${s.valueClass ?? "text-foreground"}`}>
                {s.value}
              </p>
              {s.hint && <p className="mt-0.5 text-xs font-medium text-muted-foreground">{s.hint}</p>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
