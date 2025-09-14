// src/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./API/baseApi";
import usersUiReducer from "@/features/users/users.slice";
import authReducer from "./API/auth.api";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    usersUi: usersUiReducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
