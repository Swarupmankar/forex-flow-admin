export interface SpreadPairApi {
  id: number;
  currencyPair: string;
  spreadPips: string; // comes as string in API
  spreadProfileId: number;
}

export interface CreateSpreadPairDto {
  currencyPair: string;
  spreadPips: string;
}

export interface CreateSpreadProfileDto {
  name: string;
  description: string;
  isActive: boolean;
  spreadPairs: CreateSpreadPairDto[];
}

export interface SpreadProfile {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  currencyPairs: CurrencyPairSpread[]; // ✅ keep this for UI
  createdAt: string;
  updatedAt: string;
}

export interface SpreadProfileApi {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  brokerId: number;
  createdAt: string;
  updatedAt: string;
  spreadPairs: SpreadPairApi[];
}

// Your frontend model (already defined in SpreadProfiles.tsx)
export interface CurrencyPairSpread {
  pair: string;
  spread: number;
}
