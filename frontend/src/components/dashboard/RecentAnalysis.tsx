"use client";

import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react";

import { RecentAnalysis as RecentAnalysisType } from "@/lib/dashboard";

interface RecentAnalysisProps {
  analyses: RecentAnalysisType[];
  onViewAll: () => void;
  onOpenAnalysis: (id: string) => void;
}

export default function RecentAnalysis({
  analyses,
  onViewAll,
  onOpenAnalysis,
}: RecentAnalysisProps) {
  function getScoreStyle(score: number) {
    if (score >= 80) {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (score >= 60) {
      return "border border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="panel-2 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">
            Recent analyses
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest resume evaluations
          </p>
        </div>

        {analyses.length > 0 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm font-medium text-slate-900 transition hover:text-slate-500"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="p-8 text-center">
          <div className="icon-tile mx-auto flex h-12 w-12 border border-slate-200 bg-slate-50 text-slate-700">
            <BarChart3 className="h-6 w-6" />
          </div>

          <h3 className="mt-4 font-medium text-slate-900">
            No analyses yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your completed analyses will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => onOpenAnalysis(analysis.id)}
              className="group flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="icon-tile flex h-10 w-10 shrink-0 border border-slate-200 bg-slate-50 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {analysis.resume_filename}
                  </p>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {analysis.job_title}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(analysis.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:shrink-0">
                <div className="text-center">
                  <p className="mb-1 text-xs text-slate-500">
                    Overall
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${getScoreStyle(
                      analysis.overall_score
                    )}`}
                  >
                    {analysis.overall_score}
                  </span>
                </div>

                <div className="text-center">
                  <p className="mb-1 text-xs text-slate-500">
                    Job Match
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${getScoreStyle(
                      analysis.job_match_score
                    )}`}
                  >
                    {analysis.job_match_score}
                  </span>
                </div>

                <ArrowRight className="hidden h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900 sm:block" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}