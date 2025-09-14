import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AccountTypesHeader } from "@/components/account-types/AccountTypesHeader";
import { AccountTypesFilters } from "@/components/account-types/AccountTypesFilters";
import { AccountTypesGrid } from "@/components/account-types/AccountTypesGrid";
import { AccountTypeModal } from "@/components/account-types/AccountTypeModal";
import { exportAccountTypes } from "@/lib/table-exports";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  useGetPlansQuery,
  useTogglePlanMutation,
  useUpdatePlanMutation,
} from "@/API/accountTypes.api";
import { AccountType } from "@/features/accountTypes/accountTypes.types";
import { toast } from "sonner";
import { mapBrokerPlanToAccountType } from "@/features/accountTypes/accountTypes.mapper";

export default function AccountTypes() {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountType, setEditingAccountType] =
    useState<AccountType | null>(null);

  const { data: plansData, refetch } = useGetPlansQuery();
  const [createPlan] = useCreatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();
  const [togglePlan] = useTogglePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();

  const filteredAccountTypes = accountTypes
    .filter((accountType) => {
      const matchesSearch = accountType.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && accountType.isActive) ||
        (statusFilter === "inactive" && !accountType.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default: // newest
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  // Load plans from backend
  useEffect(() => {
    if (plansData?.templates && Array.isArray(plansData.templates)) {
      setAccountTypes(plansData.templates.map(mapBrokerPlanToAccountType));
    }
  }, [plansData]);

  const handleCreateNew = () => {
    setEditingAccountType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (accountType: AccountType) => {
    setEditingAccountType(accountType);
    setIsModalOpen(true);
  };

  // delete plan
  const handleDelete = async (id: number) => {
    try {
      await deletePlan(id).unwrap();
      setAccountTypes((prev) => prev.filter((p) => p.id !== id));
      toast.success("Plan deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete plan");
    }
  };

  // toggle status (enable/disable)
  const handleToggleStatus = async (id: number) => {
    try {
      const res = await togglePlan(id).unwrap();
      setAccountTypes((prev) =>
        prev.map((p) =>
          p.id === id ? mapBrokerPlanToAccountType(res.template) : p
        )
      );
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to toggle plan status");
    }
  };

  const handleSave = async (
    accountTypeData: Omit<AccountType, "id" | "createdAt">
  ) => {
    try {
      if (editingAccountType) {
        // ✅ update existing
        const res = await updatePlan({
          id: editingAccountType.id,
          body: {
            name: accountTypeData.name,
            description: accountTypeData.description,
            minDeposit: accountTypeData.minDeposit,
            spread: accountTypeData.spread,
            spreadProfileId: accountTypeData.spreadProfileId,
            commission: accountTypeData.commission,
          },
        }).unwrap();

        setAccountTypes((prev) =>
          prev.map((p) =>
            p.id === editingAccountType.id
              ? mapBrokerPlanToAccountType(res.template)
              : p
          )
        );

        toast.success("Plan updated successfully");
      } else {
        // ✅ send spreadProfileId from dropdown
        const res = await createPlan({
          name: accountTypeData.name,
          description: accountTypeData.description,
          minDeposit: accountTypeData.minDeposit,
          spread: accountTypeData.spread,
          spreadProfileId: accountTypeData.spreadProfileId, // from dropdown
          commission: accountTypeData.commission,
        }).unwrap();

        const newPlan = mapBrokerPlanToAccountType(res.template);
        setAccountTypes((prev) => [newPlan, ...prev]);
        toast.success("Plan created successfully");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save plan");
    }
  };

  const handleExport = (format: "csv" | "pdf") => {
    const exportData = filteredAccountTypes.map((accountType) => ({
      ...accountType,
      minimumDeposit: accountType.minDeposit,
      spreadType: accountType.spreadProfileId,
      status: accountType.isActive ? "Active" : "Inactive",
    }));
    exportAccountTypes(exportData, format);
  };

  return (
    <DashboardLayout title="Account Types Management">
      <div className="h-full flex flex-col space-y-6">
        <AccountTypesHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={handleCreateNew}
          onExport={handleExport}
        />

        <AccountTypesFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <AccountTypesGrid
          accountTypes={filteredAccountTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />

        <AccountTypeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          accountType={editingAccountType}
        />
      </div>
    </DashboardLayout>
  );
}
