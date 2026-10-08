import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  hasLiveSession,
  storeTokens,
} from "@/service/axiosInstance";

// Initial State
interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

const loadInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (token && user) {
      // The session is alive while the REFRESH token is: an expired access
      // token is refreshed by the axios instance on the first request.
      if (!hasLiveSession()) {
        localStorage.clear();
      } else {
        return {
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isError: false,
          error: null,
        };
      }
    }
  } catch {
    localStorage.clear();
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isError: false,
    error: null,
  };
};

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (
    payload: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/broker/auth/login", payload);
      const { broker, tokens } = response.data;

      if (!broker || !tokens?.access?.token) {
        throw new Error("Invalid response from server");
      }

      // Save to localStorage. Both tokens: the refresh token is what keeps the
      // broker signed in past the access token's 30 minutes, for 24 hours.
      storeTokens(tokens);
      localStorage.setItem("user", JSON.stringify(broker));

      return { user: broker, token: tokens.access.token };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || "Login failed");
    }
  }
);

/**
 * Sign out: forget the session locally first (so the UI never waits on the
 * network), then tell the backend to revoke the refresh token so it cannot be
 * redeemed from a copy. A refresh token the backend no longer has is a 404 and
 * means the same thing, so the result is ignored.
 */
export const signOut = createAsyncThunk("auth/signOut", async (_, { dispatch }) => {
  let refreshToken: string | null = null;
  try {
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
  dispatch(logout());
  if (refreshToken) {
    try {
      await api.post("/broker/auth/logout", { refreshToken });
    } catch {
      // ignore
    }
  }
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState() as AuthState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isError = false;
      state.error = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

// Exports
export const { logout } = authSlice.actions;
export default authSlice.reducer;
