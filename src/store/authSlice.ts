import { createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "../auth/types";
import { api } from "./api";

const STORAGE_KEY = "taskmaster.session";

type AuthState = {
  user: AuthUser | null;
};

function isUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) return false;
  const user = value as AuthUser;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    (user.role === "ADMIN" || user.role === "USER")
  );
}

function readSession(): AuthUser | null {
  try {
    sessionStorage.removeItem("dummy-auth");
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: unknown };
    return isUser(parsed.user) ? parsed.user : null;
  } catch {
    return null;
  }
}

function writeSession(
  user: AuthUser | null,
  tokens?: { accessToken?: string; refreshToken?: string },
) {
  if (!user) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user,
      ...(tokens?.accessToken ? { accessToken: tokens.accessToken } : {}),
      ...(tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
    }),
  );
}

const authSlice = createSlice({
  name: "auth",
  initialState: { user: readSession() } satisfies AuthState,
  reducers: {
    logout(state) {
      state.user = null;
      writeSession(null);
    },
    profileUpdated(state, action: { payload: { name: string; email: string } }) {
      if (!state.user) return;
      state.user.name = action.payload.name;
      state.user.email = action.payload.email;
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: state.user }));
      } catch {
        writeSession(state.user);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.login.matchFulfilled, (state, action) => {
      const { user, accessToken, refreshToken } = action.payload.data;
      state.user = user;
      writeSession(user, { accessToken, refreshToken });
    });
  },
});

export const { logout, profileUpdated } = authSlice.actions;
export const authReducer = authSlice.reducer;
