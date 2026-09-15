import { api } from "../../api";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProfileResponse,
  HealthResponse,
} from "../../../types/auth.types";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // POST /auth/login
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Profile"],
    }),

    // POST /auth/register
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Profile"],
    }),

    // GET /auth/me  (protected — token auto-attached via prepareHeaders)
    getProfile: builder.query<ProfileResponse, void>({
      query: () => "/auth/me",
      providesTags: ["Profile"],
    }),

    // GET /auth/health
    healthCheck: builder.query<HealthResponse, void>({
      query: () => "/auth/health",
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useHealthCheckQuery,
} = authApi;