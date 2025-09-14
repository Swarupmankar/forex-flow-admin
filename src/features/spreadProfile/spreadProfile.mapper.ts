import { SpreadProfile, SpreadProfileApi } from "./spreadProfile.types";

export function mapApiToSpreadProfile(
  apiProfile: SpreadProfileApi
): SpreadProfile {
  return {
    id: apiProfile.id.toString(),
    name: apiProfile.name,
    description: apiProfile.description,
    status: apiProfile.isActive ? "Active" : "Inactive",
    currencyPairs: apiProfile.spreadPairs.map((p) => ({
      pair: p.currencyPair,
      spread: parseFloat(p.spreadPips),
    })),
    createdAt: apiProfile.createdAt || new Date().toISOString(),
    updatedAt: apiProfile.updatedAt || new Date().toISOString(),
  };
}
