// src/features/account-types/accountTypes.mapper.ts
import type { BrokerPlan, AccountType } from "./accountTypes.types";

export function mapBrokerPlanToAccountType(plan: BrokerPlan): AccountType {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    minDeposit: plan.minDeposit,
    commission: plan.commission,
    spread: plan.spread,
    spreadProfileId: plan.spreadProfileId,
    spreadProfileName: (plan as any).spreadProfileName ?? undefined,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  };
}
