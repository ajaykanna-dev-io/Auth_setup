// ─── Role Types ──────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN" | "MANAGER";

// ─── Request Types (match backend DTOs) ─────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

export interface UpdateRoleRequest {
  id: number;
  role: UserRole;
}

// ─── Response Types (match backend service returns) ──────────────

export interface User {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ProfileResponse {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRoleResponse {
  message: string;
  user: User;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

