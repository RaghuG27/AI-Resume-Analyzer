import { apiFetch } from "./api";

export interface AnalysisRequest {
  resume_id: string;
  job_id: string;
}

export interface AnalysisJobResponse {
  analysis_job_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface AnalysisStatusResponse {
  analysis_job_id: string;
  task_id: string;
  status: string;
  celery_status: string;

  result?: {
    analysis_id: string;
    overall_score: number;
  };

  error?: string;
}

export interface AnalysisRequirement {
  requirement: string;
  category: string;
  importance: string;
  matched: boolean;
  evidence?: string | null;
  relevance: number;
}

export interface AnalysisScores {
  skill_score: number;
  experience_score: number;
  responsibility_score: number;
  ats_score: number;
  education_score: number;
}

export interface AnalysisResult {
  id: string;
  resume_id: string;
  job_id: string;

  overall_score: number;
  ats_score: number;
  job_match_score: number;

  result: {
    requirements?: AnalysisRequirement[];
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    summary?: string;
    scores?: AnalysisScores;
  };

  created_at: string;
}

export interface AnalysisHistoryItem {
  id: string;
  resume_id: string;
  job_id: string;

  resume_filename: string;
  job_title: string;

  overall_score: number;
  ats_score: number;
  job_match_score: number;

  created_at: string;
}


export interface LearningResource {
  title: string;
  url: string;
  description: string;
}

export interface InterviewQuestion {
  question: string;
  difficulty: string;
}

export interface LearningTopic {
  topic: string;
  priority: string;
  reason: string;
  learning_path: string[];
  youtube_resources: LearningResource[];
  website_resources: LearningResource[];
  interview_questions: InterviewQuestion[];
}

export interface LearningPlan {
  topics: LearningTopic[];
  overall_advice: string;
}

export async function createAnalysis(
  data: AnalysisRequest
): Promise<AnalysisJobResponse> {
  return apiFetch("/api/analysis/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAnalysisStatus(
  taskId: string
): Promise<AnalysisStatusResponse> {
  return apiFetch(
    `/api/analysis/status/${taskId}`
  );
}

export async function getAnalysis(
  analysisId: string
): Promise<AnalysisResult> {
  return apiFetch(
    `/api/analysis/${analysisId}`
  );
}

export async function getAnalysisHistory(): Promise<
  AnalysisHistoryItem[]
> {
  return apiFetch("/api/analysis/");
}

export async function getLearningPlan(
  analysisId: string
): Promise<LearningPlan> {
  return apiFetch(
    `/api/analysis/${analysisId}/learning`
  );
}