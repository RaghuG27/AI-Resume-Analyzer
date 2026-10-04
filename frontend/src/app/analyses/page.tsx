"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  FileText,
  Briefcase,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  getAnalysisHistory,
  AnalysisHistoryItem,
} from "@/lib/analysis";

export default function AnalysesPage() {
  const router = useRouter();

  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalyses() {
      try {
        const data = await getAnalysisHistory();
        setAnalyses(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load analyses"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, []);

  function scoreStyle(score: number) {
    if (score >= 80) {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (score >= 60) {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    }

    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Analyses
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Review your previous resume and job matches.
            </p>
          </div>

          <button
            onClick={() => router.push("/analyses/new")}
            className="btn-primary shrink-0 px-4 py-2.5"
          >
            <Plus className="h-4 w-4" />
            New analysis
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              Loading analyses...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && analyses.length === 0 && (
          <div className="panel flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Search className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              No analyses yet
            </h2>

            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              Upload a resume, add a job description, and run your
              first AI-powered analysis.
            </p>

            <button
              onClick={() => router.push("/analyses/new")}
              className="btn-primary mt-6 px-5 py-2.5"
            >
              <Plus className="h-4 w-4" />
              Create analysis
            </button>
          </div>
        )}

        {/* Analysis list */}
        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() =>
                  router.push(`/analyses/${analysis.id}`)
                }
                className="panel card-hover group w-full p-5 text-left"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  {/* Main info */}
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {analysis.resume_filename}
                      </h2>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                          {analysis.job_title}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatDate(analysis.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-6 pl-15 lg:pl-0">
                    <Score
                      label="Overall"
                      value={analysis.overall_score}
                      className={scoreStyle(analysis.overall_score)}
                    />

                    <Score
                      label="Job Match"
                      value={analysis.job_match_score}
                      className={scoreStyle(analysis.job_match_score)}
                    />

                    <Score
                      label="ATS"
                      value={analysis.ats_score}
                      className={scoreStyle(analysis.ats_score)}
                    />

                    <ChevronRight className="hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}

function Score({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="text-center">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <span
        className={`inline-flex min-w-[2.75rem] justify-center rounded-lg px-2.5 py-1 text-sm font-semibold ${className}`}
      >
        {value}
      </span>
    </div>
  );
}
