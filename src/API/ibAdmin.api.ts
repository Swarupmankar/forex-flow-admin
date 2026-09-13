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

    getTierRates: build.query<{ success: boolean; data: { tier: IbTier; activeVersion: any } }, number>({
      query: (tierId) => ({
        url: ENDPOINTS.IB_ADMIN.TIER_RATES(tierId),
        method: "GET",
      }),
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

    getPartners: build.query<
      { success: boolean; data: { partners: IbPartnerItem[]; pagination: any } },
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
  useGetPartnerByIdQuery,
  useManualTierOverrideMutation,
  useAssignManagerMutation,
  useTogglePayoutHoldMutation,
  useSuspendPartnerMutation,
  useTriggerEvaluationMutation,
} = ibAdminApi;
