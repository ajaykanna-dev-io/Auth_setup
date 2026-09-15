import { useState, useMemo } from "react";
import {
  useGetAllUsersQuery,
  useGetOwnProfileQuery,
  useUpdateUserRoleMutation,
} from "../redux/slices/profile/profileApi";
import Table, { type Column } from "./Table";
import type { User, UserRole } from "../types/auth.types";

interface RoleBasedUserTableProps {
  currentUserId?: number;
}

export default function RoleBasedUserTable({
  currentUserId,
}: RoleBasedUserTableProps) {
  // Read role from sessionStorage after login
  const sessionRole = (sessionStorage.getItem("role") as UserRole) || "USER";

  const isPrivileged = sessionRole === "ADMIN" || sessionRole === "MANAGER";

  // ADMIN & MANAGER fetch all users via GET /users
  const {
    data: allUsers,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
    error: allUsersError,
    refetch: refetchAll,
  } = useGetAllUsersQuery(undefined, {
    skip: !isPrivileged,
  });

  // Regular USER fetches own profile via GET /users/me
  const {
    data: ownProfile,
    isLoading: isLoadingOwn,
    isFetching: isFetchingOwn,
    error: ownProfileError,
    refetch: refetchOwn,
  } = useGetOwnProfileQuery(undefined, {
    skip: isPrivileged,
  });

  // Mutation for MANAGER to update roles via PATCH /users/:id/role
  const [updateUserRole, { isLoading: isUpdatingRole }] =
    useUpdateUserRoleMutation();

  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setUpdatingUserId(userId);
    setFeedback(null);
    try {
      const response = await updateUserRole({
        id: userId,
        role: newRole,
      }).unwrap();
      setFeedback({
        type: "success",
        message: `Role updated to "${response.user.role}" for ${response.user.email}!`,
      });
      // Clear feedback after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setFeedback({
        type: "error",
        message: apiErr.data?.message || "Failed to update role.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Role badge renderer
  const renderRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    let badgeClass = "role-badge--user";
    if (r === "ADMIN") badgeClass = "role-badge--admin";
    if (r === "MANAGER") badgeClass = "role-badge--manager";

    return <span className={`role-badge ${badgeClass}`}>{r}</span>;
  };

  // Determine columns dynamically based on sessionStorage role
  const columns = useMemo<Column<User>[]>(() => {
    switch (sessionRole) {
      case "ADMIN":
        return [
          {
            key: "id",
            header: "ID",
            width: "60px",
            align: "center",
          },
          {
            key: "name",
            header: "Name",
            render: (user) => (
              <div className="table-user-cell">
                <div className="table-user-avatar">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="table-user-info">
                  <span className="table-user-name">{user.name || "—"}</span>
                  <span className="table-user-id">#{user.id}</span>
                </div>
              </div>
            ),
          },
          {
            key: "username",
            header: "Username",
            render: (user) => (
              <span className="text-secondary">
                {user.username ? `@${user.username}` : "—"}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (user) => (
              <span className="table-email">{user.email}</span>
            ),
          },
          {
            key: "role",
            header: "Role",
            align: "center",
            width: "110px",
            render: (user) => renderRoleBadge(user.role),
          },
          {
            key: "createdAt",
            header: "Created At",
            render: (user) => (
              <span className="text-secondary">{formatDate(user.createdAt)}</span>
            ),
          },
          {
            key: "updatedAt",
            header: "Updated At",
            render: (user) => (
              <span className="text-secondary">{formatDate(user.updatedAt)}</span>
            ),
          },
        ];

      case "MANAGER":
        return [
          {
            key: "id",
            header: "ID",
            width: "60px",
            align: "center",
          },
          {
            key: "name",
            header: "Name",
            render: (user) => (
              <div className="table-user-cell">
                <div className="table-user-avatar">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </div>
                <span className="table-user-name">{user.name || "—"}</span>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (user) => (
              <span className="table-email">{user.email}</span>
            ),
          },
          {
            key: "role",
            header: "Current Role",
            align: "center",
            width: "120px",
            render: (user) => renderRoleBadge(user.role),
          },
          {
            key: "actions",
            header: "Actions",
            align: "center",
            width: "180px",
            render: (user) => {
              const isCurrent = user.id === currentUserId;
              const isRowLoading =
                isUpdatingRole && updatingUserId === user.id;

              return (
                <div className="table-action-cell">
                  <select
                    className="table-role-select"
                    value={user.role}
                    disabled={isRowLoading || isCurrent}
                    title={
                      isCurrent
                        ? "You cannot modify your own role"
                        : "Change user role"
                    }
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as UserRole)
                    }
                  >
                    <option value="USER">USER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {isRowLoading && (
                    <span className="spinner spinner--xs" />
                  )}
                </div>
              );
            },
          },
        ];

      case "USER":
      default:
        return [
          {
            key: "id",
            header: "ID",
            width: "60px",
            align: "center",
          },
          {
            key: "name",
            header: "Name",
            render: (user) => (
              <span className="table-user-name">{user.name || "—"}</span>
            ),
          },
          {
            key: "username",
            header: "Username",
            render: (user) => (
              <span className="text-secondary">
                {user.username ? `@${user.username}` : "—"}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (user) => (
              <span className="table-email">{user.email}</span>
            ),
          },
          {
            key: "role",
            header: "Role",
            align: "center",
            width: "110px",
            render: (user) => renderRoleBadge(user.role),
          },
          {
            key: "createdAt",
            header: "Member Since",
            render: (user) => (
              <span className="text-secondary">{formatDate(user.createdAt)}</span>
            ),
          },
        ];
    }
  }, [sessionRole, currentUserId, isUpdatingRole, updatingUserId]);

  // Consolidate data based on role
  const tableData: User[] = useMemo(() => {
    // if (isPrivileged) {
    //   return allUsers ?? [];
    // }
    if (isPrivileged) {
    return [...(allUsers ?? [])].sort((a, b) => a.id - b.id);
  }
    return ownProfile ? [ownProfile as User] : [];
  }, [isPrivileged, allUsers, ownProfile]);

  const isLoading = isPrivileged ? isLoadingAll : isLoadingOwn;
  const isFetching = isPrivileged ? isFetchingAll : isFetchingOwn;
  const error = isPrivileged ? allUsersError : ownProfileError;

  return (
    <div className="role-table-card">
      <div className="role-table-card__header">
        <div className="role-table-title-area">
          <div className="role-table-title-row">
            <h3>
              {sessionRole === "ADMIN" && "System Users Directory"}
              {sessionRole === "MANAGER" && "Team & Role Management"}
              {sessionRole === "USER" && "My Account Information"}
            </h3>
            <span className="role-session-pill">
              <strong>{sessionRole}</strong>
            </span>
          </div>
          
        </div>

        <button
          className="role-table-refresh-btn"
          onClick={() => (isPrivileged ? refetchAll() : refetchOwn())}
          disabled={isFetching}
          title="Refresh table data"
        >
          <svg
            className={isFetching ? "icon-spin" : ""}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isFetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`table-feedback table-feedback--${feedback.type}`}
          role="status"
        >
          {feedback.type === "success" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {error && (
        <div className="table-error-alert" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {((error as { data?: { message?: string } })?.data?.message) ||
              "Failed to load table data."}
          </span>
        </div>
      )}

      <Table<User>
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No users available"
      />
    </div>
  );
}
