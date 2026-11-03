import { apiFetch } from "./api";

export interface ResumeResponse {
  id: string;
  original_filename: string;
  created_at: string;
}

export interface ResumeUploadResponse {
  message: string;
  resume_id: string;
  filename: string;
  text_length: number;
}

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<ResumeUploadResponse>("/api/resumes/upload", {
    method: "POST",
    body: formData
  });
}

export async function getResumes(): Promise<ResumeResponse[]> {
  return apiFetch<ResumeResponse[]>("/api/resumes/");
}



/**
 * Fetch the original uploaded resume as a Blob
 * using the authenticated session.
 */
export async function getResumeFile(
  resumeId: string
): Promise<Blob> {


  

  const response = await fetch(
    `/api/resumes/${encodeURIComponent(resumeId)}/file`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : "Unable to open this resume."
    );
  }

  return response.blob();
}
