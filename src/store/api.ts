import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { AuthUser } from "../auth/types";

const API_BASE = import.meta.env.API ?? "http://localhost:5000/api/v1";

export type ApiErrorData = {
  message: string;
  fields: Record<string, string>;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  status_code: number;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    session: {
      id: string;
      expiresAt: string;
    };
  };
};

type ApiState = {
  auth: { user: AuthUser | null };
};

/**
 * Turns every failed response into `{ message, fields }`.
 * Pages read `error.data.message` after `.unwrap()` rejects.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const email = (getState() as ApiState).auth.user?.email;
      if (email) headers.set("X-User-Email", email);
      return headers;
    },
  })(args, api, extra);

  if (!result.error) return result;
  const data = result.error.data as { message?: string; fields?: Record<string, string> } | undefined;
  const body: ApiErrorData = {
    message: data?.message || "The request could not be completed.",
    fields: data?.fields ?? {},
  };
  if (typeof result.error.status === "number") {
    return { error: { status: result.error.status, data: body } };
  }
  return { error: { status: "CUSTOM_ERROR", error: body.message, data: body } };
};

export function apiErrorMessage(error: unknown, fallback = "The request could not be completed.") {
  if (typeof error === "object" && error !== null && "data" in error) {
    const message = (error as { data?: { message?: string } }).data?.message;
    if (message) return message;
  }
  return fallback;
}

/**
 * One API slice for the whole app. Login is the example.
 * Copy `login` for the next call: a `query` for GET, a `mutation` for POST/PATCH/DELETE.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: build.mutation<any,any>({
      query:(body)=>({url:"/auth/register",method:"POST",body})
    }),
    resetPassword: build.mutation<any,any>({
      query:(body)=>({url:"/auth/reset-password",method:"POST",body})
    })
  }),
});

export const { useLoginMutation, useRegisterMutation, useResetPasswordMutation } = api;
