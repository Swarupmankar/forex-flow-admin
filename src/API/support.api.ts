// src/API/support.api.ts
import { baseApi } from "./baseApi";
import type {
  SupportTicketResponse,
  SupportTicketApi,
  SupportReply,
} from "@/features/support/support.types";
import { ENDPOINTS } from "@/constants/apiEndpoints";

const TICKETS_PAGE_SIZE = 100;

export const supportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** ------- Get all tickets (with optional filters) ------- */
    // Walks every page: the endpoint defaults to 10 a page, and the inbox,
    // its search and its counts all need the whole list, not the newest ten.
    getTickets: build.query<SupportTicketResponse, { status?: string }>({
      async queryFn({ status }, _api, _extraOptions, baseQuery) {
        const tickets: SupportTicketResponse["tickets"] = [];
        let last: SupportTicketResponse | undefined;
        for (let page = 1; ; page++) {
          const res = await baseQuery({
            url: ENDPOINTS.SUPPORT.ALL_TICKETS,
            method: "GET",
            params: { ...(status ? { status } : {}), page, limit: TICKETS_PAGE_SIZE },
          });
          if (res.error) return { error: res.error };
          last = res.data as SupportTicketResponse;
          tickets.push(...last.tickets);
          if (page >= last.pagination.pages || last.tickets.length === 0) break;
        }
        return {
          data: {
            message: last?.message ?? "",
            tickets,
            pagination: { page: 1, limit: tickets.length, total: tickets.length, pages: 1 },
          },
        };
      },
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
