// src/API/support.api.ts
import { baseApi } from "./baseApi";
import type {
  SupportTicketResponse,
  SupportTicketApi,
  SupportReply,
} from "@/features/support/support.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

export const supportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** ------- Get all tickets (with optional filters) ------- */
    getTickets: build.query<
      SupportTicketResponse,
      { status?: string; page?: number }
    >({
      query: ({ status, page = 1 }) => ({
        url: ENDPOINTS.SUPPORT.ALL_TICKETS,
        method: "GET",
        params: {
          ...(status ? { status } : {}),
          page,
        },
      }),
      providesTags: ["Users"],
    }),

    /** ------- Get ticket by ID ------- */
    getTicketById: build.query<SupportTicketApi, number>({
      query: (id) => ({
        url: ENDPOINTS.SUPPORT.TICKET_BY_ID(id),
        method: "GET",
      }),
      transformResponse: (res: { message: string; ticket: SupportTicketApi }) =>
        res.ticket, // ✅ unwrap to single ticket
      providesTags: (_res, _err, id) => [{ type: "Users", id }],
    }),

    /** ------- reply ticket ------- */
    sendReply: build.mutation<
      { message: string; reply: SupportReply },
      { ticketId: number; content: string; file?: File }
    >({
      query: ({ ticketId, content, file }) => {
        const formData = new FormData();
        formData.append("content", content);
        if (file) formData.append("file", file);

        return {
          url: ENDPOINTS.SUPPORT.TICKET_REPLY(ticketId),
          method: "POST",
          data: formData,
        };
      },
      invalidatesTags: (_res, _err, { ticketId }) => [
        { type: "Users", id: ticketId },
      ],
    }),

    /** ------- Close ticket ------- */
    closeTicket: build.mutation<{ message: string }, { ticketId: number }>({
      query: ({ ticketId }) => ({
        url: ENDPOINTS.SUPPORT.TICKET_CLOSE(ticketId),
        method: "PATCH",
      }),
      invalidatesTags: (_res, _err, { ticketId }) => [
        { type: "Users", id: ticketId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useSendReplyMutation,
  useCloseTicketMutation,
} = supportApi;
