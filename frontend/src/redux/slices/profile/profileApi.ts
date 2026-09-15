import { api } from "../../api";
import type {
  User,
  ProfileResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
} from "../../../types/auth.types";

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /users — Accessible to ADMIN & MANAGER
    getAllUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    // GET /users/me — Accessible to all authenticated users
    getOwnProfile: builder.query<ProfileResponse, void>({
      query: () => "/users/me",
      providesTags: ["Profile"],
    }),

    // GET /users/:id — Accessible to ADMIN & MANAGER (or self for USER)
    getUserById: builder.query<User, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),

    // PATCH /users/:id/role — MANAGER only
    updateUserRole: builder.mutation<UpdateRoleResponse, UpdateRoleRequest>({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Users", "Profile"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useLazyGetAllUsersQuery,
  useGetOwnProfileQuery,
  useLazyGetOwnProfileQuery,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useUpdateUserRoleMutation,
} = profileApi;
