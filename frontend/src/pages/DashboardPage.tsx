import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useGetProfileQuery } from "../redux/slices/auth/authApi";
import { logout } from "../redux/slices/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import RoleBasedUserTable from "../components/RoleBasedUserTable";
import ProductManagement from "../components/ProductManagement";
import type { UserRole } from "../types/auth.types";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");

  // Fetch fresh profile from /auth/me (uses JWT from prepareHeaders)
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Merge local user (from login response) with fresh profile
  const displayUser = profile ?? user;

  // Read role from sessionStorage (synced with user's role)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (
      (sessionStorage.getItem("role") as UserRole) ||
      (displayUser?.role as UserRole) ||
      "USER"
    );
  });

  const isPrivileged = currentRole === "ADMIN" || currentRole === "MANAGER";

  // Active tab: 'products' | 'profile' | 'team'
  const [activeTab, setActiveTab] = useState<"products" | "profile" | "team">(() => {
    if (tabParam === "profile" || tabParam === "team" || tabParam === "products") {
      return tabParam;
    }
    return "products";
  });

  useEffect(() => {
    if (tabParam === "profile" || tabParam === "team" || tabParam === "products") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (displayUser?.role) {
      sessionStorage.setItem("role", displayUser.role);
      setCurrentRole(displayUser.role as UserRole);
    }
  }, [displayUser?.role]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="dash-page">
        <div className="auth-ambient auth-ambient--1" />
        <div className="auth-ambient auth-ambient--2" />
        <div className="dash-loading">
          <span className="spinner spinner--lg" />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const apiErr = error as { data?: { message?: string }; status?: number };
    return (
      <div className="dash-page">
        <div className="auth-ambient auth-ambient--1" />
        <div className="auth-ambient auth-ambient--2" />
        <div className="dash-error-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2>Session expired</h2>
          <p>{apiErr.data?.message || "Please sign in again."}</p>
          <button className="auth-btn" onClick={handleLogout}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="auth-ambient auth-ambient--1" />
      <div className="auth-ambient auth-ambient--2" />

      <Navbar />

      
      {/* ─── Welcome Section ─────────────────────────── */}
      <section className="dash-welcome">
        <div className="dash-avatar">
          {(displayUser?.name ?? displayUser?.email ?? "?")[0].toUpperCase()}
        </div>
        <h1>
          Welcome back
          {displayUser?.name ? `, ${displayUser.name}` : ""}!
        </h1>
        <p className="dash-welcome__sub">
          Signed in as <strong>{displayUser?.email}</strong> &bull; Role:{" "}
          <span className="text-highlight">{currentRole}</span>
        </p>
      </section>

      {/* ─── Role-Based Navigation Tabs ─── */}
      <nav className="dash-nav-tabs" aria-label="Dashboard views">
        <button
          className={`dash-tab-btn ${
            activeTab === "products" ? "dash-tab-btn--active" : ""
          }`}
          onClick={() => {
            setActiveTab("products");
            setSearchParams({ tab: "products" });
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {isPrivileged ? "Products & Inventory" : "My Orders"}
        </button>

        <button
          className={`dash-tab-btn ${
            activeTab === "profile" ? "dash-tab-btn--active" : ""
          }`}
          onClick={() => {
            setActiveTab("profile");
            setSearchParams({ tab: "profile" });
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          View Profile
        </button>

        {isPrivileged && (
          <button
            className={`dash-tab-btn ${
              activeTab === "team" ? "dash-tab-btn--active" : ""
            }`}
            onClick={() => {
              setActiveTab("team");
              setSearchParams({ tab: "team" });
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Manage Team
          </button>
        )}
      </nav>

      {/* ─── Products & Inventory View ─── */}
      {activeTab === "products" && (
        <section className="dash-products-section">
          <ProductManagement
            currentRole={currentRole}
            initialOpenAddModal={actionParam === "add"}
          />
        </section>
      )}

      {/* ─── Profile View ─── */}
      {activeTab === "profile" && (
        <section className="dash-profile-card">
          <h2>Profile Details</h2>
          <div className="dash-profile-grid">
            <div className="dash-profile-item">
              <span className="dash-profile-label">Email</span>
              <span className="dash-profile-value">{displayUser?.email}</span>
            </div>
            {displayUser?.name && (
              <div className="dash-profile-item">
                <span className="dash-profile-label">Name</span>
                <span className="dash-profile-value">{displayUser.name}</span>
              </div>
            )}
            {displayUser?.username && (
              <div className="dash-profile-item">
                <span className="dash-profile-label">Username</span>
                <span className="dash-profile-value">
                  @{displayUser.username}
                </span>
              </div>
            )}
            <div className="dash-profile-item">
              <span className="dash-profile-label">Account Role</span>
              <span className="dash-profile-value">
                <span className={`role-badge role-badge--${currentRole.toLowerCase()}`}>
                  {currentRole}
                </span>
              </span>
            </div>
            {displayUser?.createdAt && (
              <div className="dash-profile-item">
                <span className="dash-profile-label">Member since</span>
                <span className="dash-profile-value">
                  {new Date(displayUser.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Manage Team View (ADMIN & MANAGER only) ─── */}
      {isPrivileged && activeTab === "team" && (
        <section className="dash-team-section">
          <RoleBasedUserTable currentUserId={displayUser?.id} />
        </section>
      )}
    </div>
  );
}
