import { apiFetch } from "./api";

export interface CandidateApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cover_letter?: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  company_id: string;
  company_name: string;
}

export interface CompanyApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cover_letter?: string | null;
  created_at: string;
  updated_at: string;
  candidate_email: string;
  job_title: string;
}

export interface ApplicationHistoryItem {
  id: string;
  application_id: string;
  changed_by_user_id?: string;
  old_status?: string | null;
  new_status: string;
  created_at: string;
  [key: string]: unknown;
}

export async function applyForJob(jobId: string, coverLetter?: string) {
  return apiFetch(`/api/jobs/${jobId}/applications`, {
    method: "POST",
    body: JSON.stringify({ cover_letter: coverLetter?.trim() || null })
  });
}

export async function getMyApplications(): Promise<CandidateApplication[]> {
  return apiFetch<CandidateApplication[]>("/api/applications/me");
}

export async function withdrawApplication(applicationId: string) {
  return apiFetch(`/api/applications/${applicationId}/withdraw`, { method: "POST" });
}

export async function getCompanyApplications(companyId: string): Promise<CompanyApplication[]> {
  return apiFetch<CompanyApplication[]>(`/api/companies/${companyId}/applications`);
}

export async function getApplicationHistory(applicationId: string): Promise<ApplicationHistoryItem[]> {
  return apiFetch<ApplicationHistoryItem[]>(`/api/applications/${applicationId}/history`);
}
