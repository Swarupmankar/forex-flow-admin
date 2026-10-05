// src/features/account-types/accountTypes.mapper.ts
import type { BrokerPlan, AccountType } from "./accountTypes.types";

export function mapBrokerPlanToAccountType(plan: BrokerPlan): AccountType {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    minDeposit: plan.minDeposit,
    leverage: plan.leverage,
    commission: plan.commission,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  };
}
