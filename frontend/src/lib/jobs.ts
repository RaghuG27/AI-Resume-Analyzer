
import { apiFetch } from "./api";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

export interface JobCreateRequest {
  title: string;
  description: string;
  location?: string | null;
  employment_type?: string | null;
}

export interface JobResponse {
  id: string;
  company_id: string | null;
  company_name?: string;
  title: string;
  description: string;
  location?: string | null;
  employment_type?: string | null;
  status?: "draft" | "published" | "closed";
  created_at?: string;
  updated_at?: string;
}

export interface JobMatch {
  job_id: string;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  location?: string | null;
  employment_type?: string | null;
  match_score: number;
  skill_match_score: number;
  semantic_similarity: number | null;
  matched_skills: string[];
  missing_skills: string[];
  scoring_method: string;
}

export interface JobMatchesResponse {
  resume_id: string;
  total_jobs_matched: number;
  semantic_matching_available: boolean;
  results: JobMatch[];
}

// ------------------------------------------------------
// CANDIDATE MARKETPLACE
// ------------------------------------------------------

export async function getJobs(): Promise<JobResponse[]> {
  return apiFetch<JobResponse[]>("/api/jobs/");
}

// ------------------------------------------------------
// RECRUITER JOB MANAGEMENT
// ------------------------------------------------------

export async function getMyCompanyJobs(): Promise<JobResponse[]> {
  return apiFetch<JobResponse[]>("/api/jobs/companies/mine");
}

export async function createJob(
  companyId: string,
  data: JobCreateRequest
): Promise<JobResponse> {
  return apiFetch<JobResponse>(
    `/api/jobs/companies/${companyId}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function publishCompanyJob(
  companyId: string,
  jobId: string
) {
  return apiFetch(
    `/api/jobs/companies/${companyId}/${jobId}/publish`,
    {
      method: "PATCH",
    }
  );
}

export async function closeCompanyJob(
  companyId: string,
  jobId: string
) {
  return apiFetch(
    `/api/jobs/companies/${companyId}/${jobId}/close`,
    {
      method: "PATCH",
    }
  );
}

// ------------------------------------------------------
// CANDIDATE SAVE / APPLY
// ------------------------------------------------------

export async function saveJob(jobId: string) {
  return apiFetch(`/api/jobs/${jobId}/save`, {
    method: "POST",
  });
}

export async function unsaveJob(jobId: string) {
  return apiFetch(`/api/jobs/${jobId}/save`, {
    method: "DELETE",
  });
}

export async function applyForJob(
  jobId: string,
  coverLetter?: string
) {
  return apiFetch(`/api/jobs/${jobId}/applications`, {
    method: "POST",
    body: JSON.stringify({
      cover_letter: coverLetter?.trim() || null,
    }),
  });
}



// ------------------------------------------------------
// SAVED JOBS
// ------------------------------------------------------

export interface SavedJobItem {
  id: string;
  job_id: string;
  created_at: string;
}

export interface SavedJobsResponse {
  items: SavedJobItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Return the authenticated candidate's saved jobs.
 *
 * The backend endpoint is GET /api/jobs/saved/me and returns a
 * paginated object: { items, total, page, page_size }.
 */
export async function getSavedJobs(
  page = 1,
  pageSize = 100
): Promise<SavedJobsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  return apiFetch<SavedJobsResponse>(
    `/api/jobs/saved/me?${params.toString()}`
  );
}

/**
 * Convenience helper for screens that only need the saved job IDs.
 */
export async function getSavedJobIds(): Promise<string[]> {
  const response = await getSavedJobs();
  return response.items.map((item) => item.job_id);
}

// ------------------------------------------------------
// JOB MATCHING
// ------------------------------------------------------

export async function getJobMatches(
  resumeId: string,
  limit = 20
): Promise<JobMatchesResponse> {
  const params = new URLSearchParams({
    resume_id: resumeId,
    limit: String(limit),
  });

  return apiFetch<JobMatchesResponse>(
    `/api/jobs/matches?${params.toString()}`
  );
}

export async function getJobMatch(
  jobId: string,
  resumeId: string
): Promise<JobMatch> {
  const params = new URLSearchParams({
    resume_id: resumeId,
  });

  return apiFetch<JobMatch>(
    `/api/jobs/${jobId}/match?${params.toString()}`
  );
}
