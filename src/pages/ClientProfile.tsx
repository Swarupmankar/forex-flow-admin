import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClientHeader } from "@/components/client-profile/ClientHeader";
import { ClientSummary } from "@/components/client-profile/ClientSummary";
import { KycDocumentsNew } from "@/components/client-profile/KycDocumentsNew";
import { AccountsSection } from "@/components/client-profile/AccountsSection";
import { DepositsWithdrawals } from "@/components/client-profile/DepositsWithdrawals";
import { CustomMessage } from "@/components/client-profile/CustomMessage";
import {
  useGetUserByIdQuery,
  useGetTradingAccountsQuery,
  useGetUserTransactionsQuery,
} from "@/API/users.api";
import { useGetKycByUserIdQuery } from "@/API/kyc.api";
import type {
  KycStatus,
  UserDetails,
  TradingAccount,
  Transaction,
  Client,
} from "@/features/users/users.types";
import type { KycRecord } from "@/features/kyc/kyc.types";

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
  accounts: TradingAccount[];
};

type DocStatus = "approved" | "pending" | "rejected";
type KycDocumentsUi = {
  idDocument?: {
    id: number;
    type: string;
    front?: string | null;
    back?: string | null;
    frontStatus: DocStatus;
    backStatus: DocStatus;
    frontApprovedAt?: string | null;
    frontApprovedBy?: string | null;
    frontRejectionReason?: string | null;
    backApprovedAt?: string | null;
    backApprovedBy?: string | null;
    backRejectionReason?: string | null;
  };
  selfieProof?: {
    type: string;
    document?: string | null;
    status: DocStatus;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectionReason?: string | null;
  };
  proofOfAddress?: {
    type: string;
    document?: string | null;
    status: DocStatus;
    approvedAt?: string | null;
    approvedBy?: string | null;
    rejectionReason?: string | null;
    kycId: number | string;
  };
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
    accounts: [],
  };
}

function mapStatusToUi(status: KycStatus): "approved" | "pending" | "rejected" {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}
function mapKycToDocuments(kyc: KycRecord): KycDocumentsUi {
  return {
    idDocument:
      kyc.passportFront || kyc.passportBack
        ? {
            id: kyc.id,
            type: "passport",
            front: kyc.passportFront,
            back: kyc.passportBack,
            frontStatus: mapStatusToUi(kyc.passportFrontStatus),
            backStatus: mapStatusToUi(kyc.passportBackStatus),
            frontRejectionReason: kyc.passportFrontRejectionReason,
            backRejectionReason: kyc.passportBackRejectionReason,
          }
        : undefined,
    selfieProof: kyc.selfieWithId
      ? {
          type: "selfieWithId",
          document: kyc.selfieWithId,
          status: mapStatusToUi(kyc.selfieWithIdStatus),
          rejectionReason: kyc.selfieWithIdRejectionReason,
        }
      : undefined,
    proofOfAddress: kyc.utilityBill
      ? {
          type: "utilityBill",
          document: kyc.utilityBill,
          status: mapStatusToUi(kyc.utilityBillStatus),
          rejectionReason: kyc.utilityBillRejectionReason,
          kycId: kyc.id,
        }
      : undefined,
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

  const { data: kyc, isLoading: kycLoading } = useGetKycByUserIdQuery(id!, {
    skip: !id,
  });

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

  const kycDocuments = useMemo<KycDocumentsUi | undefined>(
    () => (kyc ? mapKycToDocuments(kyc) : undefined),
    [kyc]
  );

  useEffect(() => {
    const title = client ? `${client.name} – Client Profile` : "Client Profile";
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc)
      metaDesc.setAttribute(
        "content",
        `Profile, KYC, accounts and activity details for ${
          client?.name ?? "client"
        }.`
      );
  }, [client]);

  const docCount = useMemo(() => {
    const d = kycDocuments;
    if (!d) return 0;
    let count = 0;
    if (d.idDocument?.front) count += 1;
    if (d.idDocument?.back) count += 1;
    if (d.selfieProof?.document) count += 1;
    if (d.proofOfAddress?.document) count += 1;
    return count;
  }, [kycDocuments]);

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
          <Tabs defaultValue="kyc" className="w-full">
            <TabsList className="sticky top-0 z-20 bg-background/95 backdrop-blur border rounded-lg p-1 grid grid-cols-4 shadow-sm">
              <TabsTrigger
                value="kyc"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                KYC Documents {docCount ? `(${docCount})` : ""}
              </TabsTrigger>
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
                value="messages"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Custom Message
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kyc" className="mt-6 animate-fade-in">
              <KycDocumentsNew
                client={client}
                kycDocuments={kycDocuments}
                loading={kycLoading}
                address={kyc?.address ?? null}
                kycId={kyc?.id}
              />
            </TabsContent>

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
                transactions={(transactions?.transactions ?? []).map(
                  mapTransactionToClientTx
                )}
                totalDeposit={transactions?.totalDepositAmount ?? "0"}
                totalWithdraw={transactions?.totalWithdrawAmount ?? "0"}
                loading={txLoading}
              />
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
