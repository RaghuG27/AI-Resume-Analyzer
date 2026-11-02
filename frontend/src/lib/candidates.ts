import { apiFetch } from "./api";

export interface CandidateProfile {
  id: string;
  full_name: string;
  email?: string | null;
  current_title?: string | null;
  experience_years?: number | null;
  skills?: string[] | null;
  source_resume_id?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export async function getCandidates(search?: string): Promise<CandidateProfile[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (search?.trim()) params.set("search", search.trim());
  return apiFetch<CandidateProfile[]>(`/api/candidates/?${params.toString()}`);
}

export async function extractCandidateFromResume(resumeId: string): Promise<CandidateProfile> {
  return apiFetch<CandidateProfile>(`/api/candidates/from-resume/${resumeId}`, { method: "POST" });
}

export async function deleteCandidate(candidateId: string) {
  return apiFetch<void>(`/api/candidates/${candidateId}`, { method: "DELETE" });
}
