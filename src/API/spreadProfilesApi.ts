// src/features/spreadProfiles/spreadProfilesApi.ts
import { baseApi } from "@/API/baseApi";
import { ENDPOINTS } from "@/constants/apiEndpoints";
import {
  SpreadProfileApi,
  CreateSpreadProfileDto,
} from "@/features/spreadProfile/spreadProfile.types";

export const spreadProfilesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // all profiles
    getSpreadProfiles: build.query<SpreadProfileApi[], void>({
      query: () => ({
        url: ENDPOINTS.SPREAD_PROFILES.ALL,
        method: "GET",
      }),
      providesTags: ["SpreadProfiles"],
    }),

    // create profile
    createSpreadProfile: build.mutation<
      { message: string; profile: SpreadProfileApi },
      CreateSpreadProfileDto
    >({
      query: (body) => ({
        url: ENDPOINTS.SPREAD_PROFILES.CREATE,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["SpreadProfiles"],
    }),

    // update profile
    updateSpreadProfile: build.mutation<
      { message: string; profile: SpreadProfileApi },
      { id: number; body: CreateSpreadProfileDto }
    >({
      query: ({ id, body }) => ({
        url: ENDPOINTS.SPREAD_PROFILES.UPDATE(id),
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["SpreadProfiles"],
    }),

    // delete profile
    deleteSpreadProfile: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: ENDPOINTS.SPREAD_PROFILES.DELETE(id),
        method: "DELETE",
      }),
      invalidatesTags: ["SpreadProfiles"],
    }),
  }),
});

export const {
  useGetSpreadProfilesQuery,
  useCreateSpreadProfileMutation,
  useUpdateSpreadProfileMutation,
  useDeleteSpreadProfileMutation,
} = spreadProfilesApi;
