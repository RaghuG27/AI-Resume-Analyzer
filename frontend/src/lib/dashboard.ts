import { apiFetch } from "./api";

export interface RecentAnalysis {
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

export interface DashboardStats {
  resume_count: number;
  job_count: number;
  analysis_count: number;
  average_score: number;
  recent_analyses: RecentAnalysis[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch("/api/dashboard/stats");
}