import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Users",
    "Notifications",
    "Transactions",
    "Accounting",
    "IbAdmin",
    "PaymentDetails",
    "CryptoRails",
  ],

  endpoints: () => ({}),
});
