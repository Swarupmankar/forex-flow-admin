import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { AccountsFilters } from "@/components/accounts/AccountsFilters";
import { AccountsTable } from "@/components/accounts/AccountsTable";
import { AccountEditDrawer } from "@/components/accounts/AccountEditDrawer";

export interface Account {
  id: string;
  clientName: string;
  clientAvatar: string;
  accountType: "Standard" | "Pro" | "Raw Spread";
  leverage: number;
  balance: number;
  spreadProfile: string;
  status: "Active" | "Disabled";
  createdAt: string;
}

// Mock data for accounts
const mockAccounts: Account[] = [
  {
    id: "ACC001",
    clientName: "John Smith",
    clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    accountType: "Pro",
    leverage: 100,
    balance: 12500.50,
    spreadProfile: "Standard",
    status: "Active",
    createdAt: "2024-01-15"
  },
  {
    id: "ACC002", 
    clientName: "Sarah Johnson",
    clientAvatar: "https://images.unsplash.com/photo-1494790108755-2616c95b3b3f?w=32&h=32&fit=crop&crop=face",
    accountType: "Standard",
    leverage: 50,
    balance: 8750.25,
    spreadProfile: "Standard",
    status: "Active",
    createdAt: "2024-01-20"
  },
  {
    id: "ACC003",
    clientName: "Michael Chen",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    accountType: "Raw Spread",
    leverage: 200,
    balance: 25000.00,
    spreadProfile: "Raw",
    status: "Active",
    createdAt: "2024-02-01"
  },
  {
    id: "ACC004",
    clientName: "Emma Wilson",
    clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
    accountType: "Pro",
    leverage: 100,
    balance: 5250.75,
    spreadProfile: "Tight",
    status: "Disabled",
    createdAt: "2024-02-10"
  },
  {
    id: "ACC005",
    clientName: "David Rodriguez",
    clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
    accountType: "Standard",
    leverage: 30,
    balance: 15750.80,
    spreadProfile: "Standard",
    status: "Active",
    createdAt: "2024-02-15"
  }
];

export default function AccountsSpreads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch = account.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = accountTypeFilter === "All" || account.accountType === accountTypeFilter;
    const matchesStatus = statusFilter === "All" || account.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "Oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "Balance High–Low":
        return b.balance - a.balance;
      default:
        return 0;
    }
  });

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsDrawerOpen(true);
  };

  const handleSaveAccount = (updatedAccount: Account) => {
    // In a real app, this would update the backend
    console.log("Saving account:", updatedAccount);
    setIsDrawerOpen(false);
    setSelectedAccount(null);
  };

  return (
    <DashboardLayout title="Accounts & Spreads Management">
      <div className="space-y-6">
        <AccountsHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <AccountsFilters
          accountTypeFilter={accountTypeFilter}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onAccountTypeChange={setAccountTypeFilter}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />

        <AccountsTable 
          accounts={filteredAccounts}
          onEditAccount={handleEditAccount}
        />

        <AccountEditDrawer
          account={selectedAccount}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveAccount}
        />
      </div>
    </DashboardLayout>
  );
}