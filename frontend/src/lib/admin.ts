
import { apiFetch } from "./api";

// ------------------------------------------------------
// ADMIN DASHBOARD STATISTICS
// ------------------------------------------------------

export interface AdminOverview {
  users: {
    total: number;
    candidates: number;
    recruiters: number;
    admins: number;
    active: number;
    inactive: number;
  };

  companies: {
    total: number;
  };

  jobs: {
    total: number;
  };

  applications: {
    total: number;
  };

  memberships: {
    pending: number;
    active: number;
  };
}

// ------------------------------------------------------
// ADMIN USER
// ------------------------------------------------------

export type AdminRole = "candidate" | "recruiter" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string | null;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  skip: number;
  limit: number;
}

// ------------------------------------------------------
// COMPANY MEMBERSHIP
// ------------------------------------------------------

export interface AdminMembership {
  membership_id: string;
  company_id: string;
  company_name: string;
  user_id: string;
  user_email: string;
  membership_role: string;
  status: string;
  created_at: string;
}

export interface AdminActionResponse {
  message: string;
  membership_id?: string;
  user_id?: string;
  is_active?: boolean;
  status?: string;
}

// ------------------------------------------------------
// DASHBOARD STATISTICS
// GET /api/admin/stats
// ------------------------------------------------------

export async function getAdminOverview(): Promise<AdminOverview> {
  return apiFetch<AdminOverview>("/api/admin/stats");
}

// ------------------------------------------------------
// USER MANAGEMENT
// GET /api/admin/users
// ------------------------------------------------------

export async function getAdminUsers(
  role: AdminRole | "all" = "all",
  search = "",
  isActive?: boolean,
  skip = 0,
  limit = 100
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (role !== "all") {
    params.set("role", role);
  }

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (isActive !== undefined) {
    params.set("is_active", String(isActive));
  }

  params.set("skip", String(skip));
  params.set("limit", String(limit));

  return apiFetch<AdminUsersResponse>(
    `/api/admin/users?${params.toString()}`
  );
}

// ------------------------------------------------------
// ACTIVATE / DEACTIVATE USER
// PATCH /api/admin/users/{user_id}/status
// ------------------------------------------------------

export async function setAdminUserActive(
  userId: string,
  isActive: boolean
): Promise<AdminActionResponse> {
  const params = new URLSearchParams({
    is_active: String(isActive),
  });

  return apiFetch<AdminActionResponse>(
    `/api/admin/users/${userId}/status?${params.toString()}`,
    {
      method: "PATCH",
    }
  );
}

// ------------------------------------------------------
// PENDING COMPANY MEMBERSHIPS
// GET /api/companies/admin/pending-memberships
// ------------------------------------------------------

export async function getPendingAdminMemberships(): Promise<
  AdminMembership[]
> {
  return apiFetch<AdminMembership[]>(
    "/api/companies/admin/pending-memberships"
  );
}

// ------------------------------------------------------
// APPROVE COMPANY MEMBERSHIP
// POST /api/companies/admin/memberships/{id}/approve
// ------------------------------------------------------

export async function approveAdminMembership(
  membershipId: string
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/api/companies/admin/memberships/${membershipId}/approve`,
    {
      method: "POST",
    }
  );
}

// ------------------------------------------------------
// REJECT COMPANY MEMBERSHIP
// POST /api/admin/memberships/{id}/reject
// ------------------------------------------------------

export async function rejectAdminMembership(
  membershipId: string
): Promise<AdminActionResponse> {
  return apiFetch<AdminActionResponse>(
    `/api/admin/memberships/${membershipId}/reject`,
    {
      method: "POST",
    }
  );
}
