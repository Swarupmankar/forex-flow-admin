// src/features/account-types/accountTypes.types.ts

// REAL or DEMO: which kind of trading account may be opened on a type.
export type AccountKind = "REAL" | "DEMO";

// Backend type
export interface BrokerPlan {
  id: number;
  brokerId: number;
  name: string;
  minDeposit: number;
  description: string;
  leverage: number;
  commission: number;
  // The Taker Feed this type's traders are priced on. Set on create, fixed after.
  takerFeed: string;
  // A copy of takerFeed, made by the backend. It is what the trading JWT carries.
  nameKey: string;
  accountType: AccountKind;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI type (used in components)
export interface AccountType {
  id: number;
  name: string;
  description: string;
  minDeposit: number;
  leverage: number;
  commission: number;
  takerFeed: string;
  accountType: AccountKind;
  isActive: boolean;
  createdAt: string;
}

// API request/response
export interface CreatePlanRequest {
  name: string;
  minDeposit: number;
  description: string;
  leverage: number;
  commission: number;
  // Required on create. On update the backend accepts only the existing value,
  // so it is left out.
  takerFeed?: string;
  // Required on create; on update it may be changed, or left out to keep it.
  accountType?: AccountKind;
}

export interface CreatePlanResponse {
  message: string;
  template: BrokerPlan;
}
