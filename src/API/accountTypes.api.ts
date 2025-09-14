import { baseApi } from "@/API/baseApi";
import type {
  BrokerPlan,
  CreatePlanRequest,
  CreatePlanResponse,
} from "@/features/accountTypes/accountTypes.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

export const plansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    //create plan
    createPlan: build.mutation<CreatePlanResponse, CreatePlanRequest>({
      query: (body) => ({
        url: ENDPOINTS.PLANS.CREATE, // "/broker/plans/create"
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Users"],
    }),

    //all plans
    getPlans: build.query<{ message: string; templates: BrokerPlan[] }, void>({
      query: () => ({
        url: ENDPOINTS.PLANS.ALL, // define "/broker/plans"
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    //delete
    deletePlan: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: ENDPOINTS.PLANS.DELETE(id),
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // enable/ disbale
    togglePlan: build.mutation<
      { message: string; template: BrokerPlan },
      number
    >({
      query: (id) => ({
        url: ENDPOINTS.PLANS.TOGGLE(id),
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),

    // edit plans
    updatePlan: build.mutation<
      { message: string; template: BrokerPlan },
      { id: number; body: CreatePlanRequest }
    >({
      query: ({ id, body }) => ({
        url: ENDPOINTS.PLANS.UPDATE(id),
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useCreatePlanMutation,
  useGetPlansQuery,
  useDeletePlanMutation,
  useTogglePlanMutation,
  useUpdatePlanMutation,
} = plansApi;
