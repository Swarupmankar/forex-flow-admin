import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Users",
    "SpreadProfiles",
    "Notifications",
    "Transactions",
    "Accounting",
  ],

  endpoints: () => ({}),
});
