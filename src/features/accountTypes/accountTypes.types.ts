// src/features/account-types/accountTypes.types.ts

// Backend type
export interface BrokerPlan {
  id: number;
  brokerId: number;
  name: string;
  minDeposit: number;
  description: string;
  spread: number;
  spreadProfileId: number;
  commission: number;
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
  commission: number;
  spread: number;
  spreadProfileId: number;
  spreadProfileName?: string;
  isActive: boolean;
  createdAt: string;
}

// API request/response
export interface CreatePlanRequest {
  name: string;
  minDeposit: number;
  description: string;
  spread: number;
  spreadProfileId: number;
  commission: number;
}

export interface CreatePlanResponse {
  message: string;
  template: BrokerPlan;
}
