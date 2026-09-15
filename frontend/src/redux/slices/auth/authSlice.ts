import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../../types/auth.types";

// ─── State Shape ─────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ─── Rehydrate from localStorage & sync sessionStorage ─────────

const persistedToken = sessionStorage.getItem("token");
const persistedUser = sessionStorage.getItem("user");
const parsedUser: User | null = persistedUser ? JSON.parse(persistedUser) : null;

if (parsedUser?.role && !sessionStorage.getItem("role")) {
  sessionStorage.setItem("role", parsedUser.role);
}

const initialState: AuthState = {
  user: parsedUser,
  token: persistedToken ?? null,
  isAuthenticated: !!persistedToken,
};

// ─── Slice ───────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Persist to localStorage
      sessionStorage.setItem("token", action.payload.token);
      sessionStorage.setItem("user", JSON.stringify(action.payload.user));

      // Persist role & user to sessionStorage
      sessionStorage.setItem("role", action.payload.user.role);
      sessionStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      sessionStorage.removeItem("role");
      sessionStorage.removeItem("user");
    },

    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        sessionStorage.setItem("user", JSON.stringify(state.user));
        if (state.user.role) {
          sessionStorage.setItem("role", state.user.role);
        }
        sessionStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
