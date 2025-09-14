import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { AdminManagementTab } from "@/components/settings/AdminManagementTab";
import { SystemSettingsTab } from "@/components/settings/SystemSettingsTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { AddAdminModal } from "@/components/settings/AddAdminModal";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "viewer";
  lastLogin?: Date;
  status: "active" | "disabled";
  avatar?: string;
  createdAt: Date;
}

const MOCK_ADMINS: Admin[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@vaultpro.com",
    role: "super_admin",
    lastLogin: new Date("2024-01-20T14:30:00"),
    status: "active",
    createdAt: new Date("2024-01-01T09:00:00"),
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@vaultpro.com",
    role: "admin",
    lastLogin: new Date("2024-01-20T11:15:00"),
    status: "active",
    createdAt: new Date("2024-01-05T10:30:00"),
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@vaultpro.com",
    role: "viewer",
    lastLogin: new Date("2024-01-19T16:45:00"),
    status: "disabled",
    createdAt: new Date("2024-01-10T14:20:00"),
  },
  {
    id: "4",
    name: "Emma Davis",
    email: "emma.davis@vaultpro.com",
    role: "admin",
    lastLogin: new Date("2024-01-20T09:20:00"),
    status: "active",
    createdAt: new Date("2024-01-15T11:45:00"),
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("admin-management");
  const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  const handleAddAdmin = (adminData: Omit<Admin, "id" | "createdAt" | "lastLogin">) => {
    const newAdmin: Admin = {
      ...adminData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setAdmins([newAdmin, ...admins]);
    setIsAddAdminModalOpen(false);
  };

  const handleUpdateAdmin = (updatedAdmin: Admin) => {
    setAdmins(admins.map(admin => 
      admin.id === updatedAdmin.id ? updatedAdmin : admin
    ));
  };

  const handleDeleteAdmin = (id: string) => {
    setAdmins(admins.filter(admin => admin.id !== id));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "admin-management":
        return (
          <AdminManagementTab
            admins={admins}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
          />
        );
      case "system-settings":
        return <SystemSettingsTab />;
      case "security":
        return <SecurityTab />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Settings & Admin Management">
      <div className="space-y-6">
        <SettingsHeader onAddAdminClick={() => setIsAddAdminModalOpen(true)} />
        
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {renderTabContent()}

        <AddAdminModal
          isOpen={isAddAdminModalOpen}
          onClose={() => setIsAddAdminModalOpen(false)}
          onSave={handleAddAdmin}
        />
      </div>
    </DashboardLayout>
  );
}