
import { apiFetch } from "./api";

// ------------------------------------------------------
// COMPANY MEMBERSHIP
// ------------------------------------------------------

export interface CompanyMembership {
  company_id: string;
  company_name: string;
  location?: string | null;
  membership_role: string;
  status: string;
  created_at: string;
}

// ------------------------------------------------------
// COMPANY
// ------------------------------------------------------

export interface CompanyCreateRequest {
  name: string;
  website?: string | null;
  description?: string | null;
  location?: string | null;
}

export interface CompanyDetails {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  location?: string | null;
}

export interface CompanyCreateResponse {
  message: string;
  company: CompanyDetails;
  membership_status: string;
}

// ------------------------------------------------------
// ADMIN MEMBERSHIP APPROVAL
// ------------------------------------------------------

export interface PendingMembership {
  membership_id: string;
  company_id: string;
  company_name: string;
  user_id: string;
  user_email: string;
  membership_role: string;
  status: string;
  created_at: string;
}

// ------------------------------------------------------
// GET RECRUITER COMPANIES
// ------------------------------------------------------

export async function getMyCompanies(): Promise<CompanyMembership[]> {
  return apiFetch<CompanyMembership[]>("/api/companies/me");
}

// ------------------------------------------------------
// CREATE COMPANY
// ------------------------------------------------------

export async function createCompany(
  data: CompanyCreateRequest
): Promise<CompanyCreateResponse> {
  return apiFetch<CompanyCreateResponse>("/api/companies/", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      website: data.website || null,
      description: data.description || null,
      location: data.location || null,
    }),
  });
}

// ------------------------------------------------------
// COMPANY JOB PERMISSIONS
// ------------------------------------------------------

export async function getCompanyPermissions(companyId: string) {
  return apiFetch<{
    company_id: string;
    membership_role: string;
    can_manage_jobs: boolean;
  }>(`/api/companies/${companyId}/jobs/permissions`);
}

// ------------------------------------------------------
// ADMIN: GET PENDING MEMBERSHIPS
// ------------------------------------------------------

export async function getPendingMemberships(): Promise<
  PendingMembership[]
> {
  return apiFetch<PendingMembership[]>(
    "/api/companies/admin/pending-memberships"
  );
}

// ------------------------------------------------------
// ADMIN: APPROVE MEMBERSHIP
// ------------------------------------------------------

export async function approveMembership(membershipId: string) {
  return apiFetch(
    `/api/companies/admin/memberships/${membershipId}/approve`,
    {
      method: "POST",
    }
  );
}
