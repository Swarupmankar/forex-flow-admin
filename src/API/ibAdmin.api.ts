import { baseApi } from "@/API/baseApi";
import { ENDPOINTS } from "@/constants/apiEndpoints";

export interface IbProgramme {
  id: number;
  brokerId: number;
  name: string;
  evaluationMode: "CALENDAR_MONTH" | "ROLLING_30_DAYS" | "LIFETIME";
  timezone: string;
  evaluationTime: string;
  payoutSchedule: string;
  activeTraderMinLots: number;
  tiers: IbTier[];
}

export interface IbTier {
  id: number;
  programmeId: number;
  name: string;
  levelOrder: number;
  minVolumeLots: number;
  minActiveTraders: number;
  qualificationRule: "BOTH" | "EITHER";
  status: "ACTIVE" | "INACTIVE";
  bonusAmount: number;
  bonusTiming?: string;
  bonusBenefitsText?: string;
  autoDowngradeEnabled: boolean;
  downgradeGraceCycles: number;
  versions?: any[];
  /** The broker's account types (Account Types Management) with this tier's eligibility */
  accountTypes?: IbAccountTypeOption[];
  symbolCount?: number;
  /** IBs holding this tier now */
  assignedIbCount?: number;
}

export interface IbAccountTypeOption {
  /** AccountTypes id as a string; IB rates are keyed by it */
  id: string;
  name: string;
  isActive: boolean;
  isEligible: boolean;
}

export interface IbTierRatesResponse {
  tier: IbTier;
  accountTypes: IbAccountTypeOption[];
  /** Symbols from the broker's spread profiles */
  symbols: string[];
  activeVersion: any;
}

export interface IbPartnerItem {
  ibUserId: number;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  currentTier: string;
  currentTierId?: number;
  isAtRisk: boolean;
  isSuspended: boolean;
  payoutHold: boolean;
  assignedManager: string;
  totalClients: number;
  activeClients: number;
  mtdLots: number;
  mtdCommission: number;
  pendingPayout: number;
  joinedAt: string;
}

/** Header cards on IB management, over every IB of the broker */
export interface IbPartnersSummary {
  totalPartners: number;
  activePartners: number;
  needsReview: number;
  /** closed REAL lots in the running evaluation period */
  periodVolumeLots: number;
  pendingPayouts: number;
}

export interface IbPartnersPage {
  partners: IbPartnerItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary?: IbPartnersSummary;
}

/** The backend serves at most this many partners per request. */
const PARTNERS_PAGE_SIZE = 100;

export interface RatePublishRequest {
  effectiveFrom: string;
  changeReason: string;
  accountTypes: Array<{ accountTypeId: string; isEligible: boolean }>;
  symbolRates: Array<{ symbolId: string; accountRates: Record<string, number> }>;
}

export const ibAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProgramme: build.query<{ success: boolean; data: IbProgramme }, void>({
      query: () => ({
        url: ENDPOINTS.IB_ADMIN.PROGRAMME,
        method: "GET",
      }),
      providesTags: ["IbAdmin"],
    }),

    updateProgramme: build.mutation<{ success: boolean; data: IbProgramme }, Partial<IbProgramme>>({
      query: (body) => ({
        url: ENDPOINTS.IB_ADMIN.PROGRAMME,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    getTiers: build.query<{ success: boolean; data: IbTier[] }, void>({
      query: () => ({
        url: ENDPOINTS.IB_ADMIN.TIERS,
        method: "GET",
      }),
      providesTags: ["IbAdmin"],
    }),

    createTier: build.mutation<{ success: boolean; data: IbTier }, Partial<IbTier>>({
      query: (body) => ({
        url: ENDPOINTS.IB_ADMIN.TIERS,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    updateTier: build.mutation<{ success: boolean; data: IbTier }, { tierId: number; body: Partial<IbTier> }>({
      query: ({ tierId, body }) => ({
        url: ENDPOINTS.IB_ADMIN.TIER_BY_ID(tierId),
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    deleteTier: build.mutation<{ success: boolean; message: string }, number>({
      query: (tierId) => ({
        url: ENDPOINTS.IB_ADMIN.TIER_BY_ID(tierId),
        method: "DELETE",
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    getTierRates: build.query<{ success: boolean; data: IbTierRatesResponse }, number>({
      query: (tierId) => ({
        url: ENDPOINTS.IB_ADMIN.TIER_RATES(tierId),
        method: "GET",
      }),
      // Prefetched for every tier; keep them while the admin works on the page
      keepUnusedDataFor: 600,
      providesTags: ["IbAdmin"],
    }),

    publishTierRates: build.mutation<{ success: boolean; data: any }, { tierId: number; body: RatePublishRequest }>({
      query: ({ tierId, body }) => ({
        url: ENDPOINTS.IB_ADMIN.TIER_RATES(tierId),
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    /**
     * Every IB of the broker: fetches page after page, so the list is not cut
     * off at one page however many IBs there are.
     */
    getAllPartners: build.query<{ success: boolean; data: IbPartnersPage }, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const partners: IbPartnerItem[] = [];
        let summary: IbPartnersSummary | undefined;
        let total = 0;
        for (let page = 1; ; page++) {
          const res = await baseQuery({
            url: ENDPOINTS.IB_ADMIN.PARTNERS,
            method: "GET",
            params: { page, limit: PARTNERS_PAGE_SIZE },
          });
          if (res.error) return { error: res.error };
          const data = (res.data as { data: IbPartnersPage }).data;
          partners.push(...data.partners);
          summary = summary ?? data.summary;
          total = data.pagination.total;
          if (page >= data.pagination.totalPages || data.partners.length === 0) break;
        }
        return {
          data: {
            success: true,
            data: {
              partners,
              pagination: { page: 1, limit: partners.length, total, totalPages: 1 },
              summary,
            },
          },
        };
      },
      providesTags: ["IbAdmin"],
    }),

    getPartners: build.query<
      { success: boolean; data: IbPartnersPage },
      { search?: string; status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: ENDPOINTS.IB_ADMIN.PARTNERS,
        method: "GET",
        params,
      }),
      providesTags: ["IbAdmin"],
    }),

    getPartnerById: build.query<{ success: boolean; data: any }, number>({
      query: (ibId) => ({
        url: ENDPOINTS.IB_ADMIN.PARTNER_BY_ID(ibId),
        method: "GET",
      }),
      providesTags: ["IbAdmin"],
    }),

    manualTierOverride: build.mutation<
      { success: boolean; data: any },
      { ibId: number; body: { targetTierId: number; grantBonus: boolean; reason: string } }
    >({
      query: ({ ibId, body }) => ({
        url: ENDPOINTS.IB_ADMIN.MANUAL_TIER(ibId),
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    assignManager: build.mutation<{ success: boolean; data: any }, { ibId: number; managerName: string }>({
      query: ({ ibId, managerName }) => ({
        url: ENDPOINTS.IB_ADMIN.ASSIGN_MANAGER(ibId),
        method: "POST",
        data: { managerName },
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    togglePayoutHold: build.mutation<
      { success: boolean; data: any },
      { ibId: number; hold: boolean; reason: string }
    >({
      query: ({ ibId, hold, reason }) => ({
        url: ENDPOINTS.IB_ADMIN.PAYOUT_HOLD(ibId),
        method: "POST",
        data: { hold, reason },
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    suspendPartner: build.mutation<
      { success: boolean; data: any },
      { ibId: number; suspend: boolean; reason: string }
    >({
      query: ({ ibId, suspend, reason }) => ({
        url: ENDPOINTS.IB_ADMIN.SUSPEND_PARTNER(ibId),
        method: "POST",
        data: { suspend, reason },
      }),
      invalidatesTags: ["IbAdmin"],
    }),

    triggerEvaluation: build.mutation<{ success: boolean; data: any; message: string }, void>({
      query: () => ({
        url: ENDPOINTS.IB_ADMIN.TRIGGER_EVALUATION,
        method: "POST",
      }),
      invalidatesTags: ["IbAdmin"],
    }),
  }),
});

export const {
  useGetProgrammeQuery,
  useUpdateProgrammeMutation,
  useGetTiersQuery,
  useCreateTierMutation,
  useUpdateTierMutation,
  useDeleteTierMutation,
  useGetTierRatesQuery,
  usePublishTierRatesMutation,
  useGetPartnersQuery,
  useGetAllPartnersQuery,
  useGetPartnerByIdQuery,
  useManualTierOverrideMutation,
  useAssignManagerMutation,
  useTogglePayoutHoldMutation,
  useSuspendPartnerMutation,
  useTriggerEvaluationMutation,
} = ibAdminApi;
