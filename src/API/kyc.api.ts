// src/API/kyc.api.ts
import { baseApi } from "./baseApi";
import type {
  KycResponse,
  KycRecord,
  KycActionResponse,
  KycReviewRequestBody,
  KycDeleteRequestBody,
} from "@/features/kyc/kyc.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

export const kycApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getKycByUserId: build.query<KycRecord, number | string>({
      query: (userId) => ({
        url: ENDPOINTS.KYC_ALL_REQUESTS,
        method: "GET",
        params: { userId },
      }),
      providesTags: (_res, _err, id) => [{ type: "Users" as const, id }],
      transformResponse: (res: KycResponse) => res.data.kyc,
    }),

    /** -------  REVIEW document mutation ------- */

    reviewKycDocument: build.mutation<
      KycActionResponse,
      { kycId: number | string; body: KycReviewRequestBody }
    >({
      query: ({ kycId, body }) => {
        console.log("[KYC DELETE QUERY]", { kycId, body }); // debug log
        return {
          url: ENDPOINTS.KYC_REVIEW(kycId),
          method: "PATCH",
          data: body,
        };
      },
      invalidatesTags: (_res, _err, args) => [
        { type: "Users", id: args.kycId },
      ],
    }),

    /** ------- New: Delete document mutation ------- */
    deleteKycDocument: build.mutation<
      KycActionResponse,
      { kycId: number | string; body: KycDeleteRequestBody }
    >({
      query: ({ kycId, body }) => {
        return {
          url: ENDPOINTS.KYC_DELETE(kycId),
          method: "DELETE",
          data: body,
        };
      },
      invalidatesTags: (_res, _err, args) => [
        { type: "Users", id: args.kycId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKycByUserIdQuery,
  useReviewKycDocumentMutation,
  useDeleteKycDocumentMutation,
} = kycApi;
