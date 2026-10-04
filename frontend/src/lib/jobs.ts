import { apiFetch } from "./api";

export interface JobCreateRequest {
  title: string;
  description: string;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
}

export async function createJob(
  data: JobCreateRequest
): Promise<JobResponse> {
  return apiFetch("/api/jobs/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getJobs(): Promise<
  JobResponse[]
> {
  return apiFetch("/api/jobs/");
}