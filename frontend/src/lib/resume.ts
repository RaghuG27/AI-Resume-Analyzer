import { apiFetch } from "./api";

export interface ResumeResponse {
  id: string;
  original_filename: string;
  created_at: string;
}

export async function uploadResume(
  file: File
): Promise<ResumeResponse> {
  const formData = new FormData();

  formData.append("file", file);

  return apiFetch("/api/resumes/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getResumes(): Promise<
  ResumeResponse[]
> {
  return apiFetch("/api/resumes/");
}