
import { apiFetch } from "./api";

export type UserRole = "candidate" | "recruiter" | "admin";

export interface RegisterRequest {
  email: string;
  password: string;
  role: "candidate" | "recruiter";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user_id?: string;
  email?: string;
  role?: UserRole;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string | null;
}

export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(
  data: LoginRequest
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<User> {
  const user = await apiFetch<User>("/api/auth/me");

  if (!user?.id || !user?.role) {
    throw new Error("Unable to retrieve user account details");
  }

  return user;
}

export async function logout(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/logout", {
    method: "POST",
  });
}

export function getPostLoginPath(user: User): string {
  if (!user.is_active) {
    return "/login";
  }

  switch (user.role) {
    case "admin":
      return "/admin";

    case "recruiter":
      return "/recruiter";

    case "candidate":
      return "/dashboard";

    default:
      return "/login";
  }
}

export function hasRole(
  user: User | null,
  allowedRoles: UserRole[]
): boolean {
  return Boolean(
    user &&
    user.is_active &&
    allowedRoles.includes(user.role)
  );
}
