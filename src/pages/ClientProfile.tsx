import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClientHeader } from "@/components/client-profile/ClientHeader";
import { ClientSummary } from "@/components/client-profile/ClientSummary";
import { AccountsSection } from "@/components/client-profile/AccountsSection";
import { DepositsWithdrawals } from "@/components/client-profile/DepositsWithdrawals";
import { CustomMessage } from "@/components/client-profile/CustomMessage";
import { IbSection } from "@/components/client-profile/IbSection";
import { toNum } from "@/components/transactions/FxAmount";
import {
  useGetUserByIdQuery,
  useGetTradingAccountsQuery,
  useGetUserTransactionsQuery,
} from "@/API/users.api";
import type {
  UserDetails,
  TradingAccount,
  Transaction,
  Client,
} from "@/features/users/users.types";

type ClientProfileModel = {
  id: number;
  name: string;
  email: string;
  phoneNumber: number;
  referralCode: string;
  accountId: number;
  kycStatus: "pending" | "approved" | "rejected";
  walletBalance: number;
  linkedAccounts: number;
  linkedTradingAccounts: number;
  registrationDate: string;
  daysActiveFromRegistration: number;
  totalDeposits: number;
  totalWithdrawals: number;
  profit: string;
  totalCommission: number | null;
  totalLots: number | null;
  ibClients: number | null;
  ibTier: string | null;
  accounts: TradingAccount[];
};


function mapKycStatusLower(s: string): ClientProfileModel["kycStatus"] {
  const M: Record<string, ClientProfileModel["kycStatus"]> = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  };
  return M[s?.toUpperCase()] ?? "pending";
}
function toClientProfileModel(u: UserDetails): ClientProfileModel {
  return {
    id: Number(u.accountId),
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber,
    referralCode: u.referralCode,
    accountId: Number(u.accountId),
    kycStatus: mapKycStatusLower(u.kycStatus),
    walletBalance: u.walletBalance,
    linkedAccounts: u.totalActiveTradingAccounts,
    linkedTradingAccounts: u.totalActiveTradingAccounts ?? 0,
    registrationDate: u.registrationDate,
    daysActiveFromRegistration: u.daysActiveFromRegistration,
    totalDeposits: u.totalDeposits,
    totalWithdrawals: u.totalWithdrawals,
    profit: u.netProfit,
    totalCommission: u.totalCommission,
    totalLots: u.totalLots,
    ibClients: u.ibClients,
    ibTier: u.ibTier,
    accounts: [],
  };
}


function mapTradingAccountToClientAccount(acc: TradingAccount) {
  return {
    type: acc.accountType.toLowerCase(), // "REAL" → "real"
    leverage: `1:${acc.leverage}`, // convert number → string
    balance: Number(acc.fundsAvailable), // string → number
    status: (acc.accountStatus === "ACTIVE" ? "active" : "archive") as
      | "active"
      | "archive",
    accountId: String(acc.id),
    accountType: acc.accountType.toLowerCase() as "real" | "demo",
    server: String(acc.serverId),
    lastActivity: acc.updatedAt,
  };
}

function mapTransactionToClientTx(t: Transaction) {
  return {
    id: Number(t.id),
    type: (t.transactionType === "DEPOSIT" ? "deposit" : "withdrawal") as
      | "deposit"
      | "withdrawal",
    amount: Number(t.amount),
    inrAmount: toNum(t.inrAmount),
    fxRate: toNum(t.fxRate),
    date: t.createdAt,
    method: (t.mode ?? "").toLowerCase(),
    status:
      t.transactionStatus === "APPROVED"
        ? ("approved" as const)
        : t.transactionStatus === "PENDING"
        ? ("pending" as const)
        : ("rejected" as const),
    account: t.utrNo ?? t.upiId ?? t.bankAccountNo ?? t.cryptoAddress ?? "",
  };
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError, error } = useGetUserByIdQuery(
    id!,
    {
      skip: !id,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: tradingAccounts, isLoading: tradingLoading } =
    useGetTradingAccountsQuery(id!, { skip: !id });
  const { data: transactions, isLoading: txLoading } =
    useGetUserTransactionsQuery(id!, { skip: !id });


  const client = useMemo(() => {
    if (!data) return null;
    return {
      ...toClientProfileModel(data),
      accounts: (tradingAccounts?.allTradingAccounts ?? []).map(
        mapTradingAccountToClientAccount
      ),
      transactions: (transactions?.transactions ?? []).map(
        mapTransactionToClientTx
      ),
      totalDeposit: transactions?.totalDepositAmount ?? "0",
      totalWithdraw: transactions?.totalWithdrawAmount ?? "0",
    };
  }, [data, tradingAccounts, transactions]);


  useEffect(() => {
    const title = client ? `${client.name} – Client Profile` : "Client Profile";
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc)
      metaDesc.setAttribute(
        "content",
        `Profile, accounts and activity details for ${
          client?.name ?? "client"
        }.`
      );
  }, [client]);


  if (!id) {
    return (
      <DashboardLayout title="Client Not Found">
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            We couldn't find this client.
          </p>
          <Button onClick={() => navigate(-1)} variant="secondary">
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading || isFetching) {
    return (
      <DashboardLayout title="Loading Client…">
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Fetching client data…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Client Error">
        <div className="bg-destructive/10 text-destructive border border-destructive/30 p-4 rounded mb-4">
          Failed to load client:{" "}
          {String((error as any)?.status ?? "Unknown error")}
        </div>
        <Button onClick={() => navigate(-1)} variant="secondary">
          Go Back
        </Button>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Client Not Found">
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            We couldn't find this client.
          </p>
          <Button onClick={() => navigate(-1)} variant="secondary">
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Client: ${client.name}`}>
      <main className="space-y-6">
        <ClientHeader client={client} onBack={() => navigate("/clients")} />
        <ClientSummary client={client} />

        <section>
          {/* No KYC documents tab: verification runs on Sumsub. The KYC status
              in the header above comes from there and stays. */}
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="sticky top-0 z-20 bg-background/95 backdrop-blur border rounded-lg p-1 grid grid-cols-4 shadow-sm">
              <TabsTrigger
                value="accounts"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Accounts ({client.accounts.length})
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Deposits & Withdrawals
              </TabsTrigger>
              <TabsTrigger
                value="ib"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Referrals
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Custom Message
              </TabsTrigger>
            </TabsList>


            <TabsContent value="accounts" className="mt-6 animate-fade-in">
              <AccountsSection
                client={client}
                accounts={tradingAccounts?.allTradingAccounts ?? []}
                totalBalance={tradingAccounts?.totalBalance ?? "0"}
                avgLeverage={tradingAccounts?.avgLeverage ?? "0"}
                loading={tradingLoading}
              />
            </TabsContent>

            <TabsContent value="transactions" className="mt-6 animate-fade-in">
              <DepositsWithdrawals
                client={client}
                rawTransactions={transactions?.transactions ?? []}
                loading={txLoading}
                clientId={id}
              />
            </TabsContent>

            <TabsContent value="ib" className="mt-6 animate-fade-in">
              {id && <IbSection clientId={id} />}
            </TabsContent>

            <TabsContent value="messages" className="mt-6 animate-fade-in">
              <CustomMessage client={client} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </DashboardLayout>
  );
}
