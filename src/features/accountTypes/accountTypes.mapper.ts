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
    takerFeed: plan.takerFeed,
    // Types from before the backend had a kind come back as REAL from the
    // migration default; the fallback only covers a stale API build.
    accountType: plan.accountType ?? "REAL",
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  };
}
