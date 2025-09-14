import { AccountType } from "@/features/accountTypes/accountTypes.types";
import { AccountTypeCard } from "./AccountTypeCard";

interface AccountTypesGridProps {
  accountTypes: AccountType[];
  onEdit: (accountType: AccountType) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export function AccountTypesGrid({
  accountTypes,
  onEdit,
  onDelete,
  onToggleStatus,
}: AccountTypesGridProps) {
  if (accountTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          No account types found
        </div>
        <div className="text-muted-foreground text-sm mt-2">
          Try adjusting your search or filters
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {accountTypes.map((accountType) => (
        <AccountTypeCard
          key={accountType.id}
          accountType={accountType}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
