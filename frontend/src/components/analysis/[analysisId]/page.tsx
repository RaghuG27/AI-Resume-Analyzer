"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";

import AppShell from "@/components/layout/AppShell";

import ScoreCard from "@/components/analysis/ScoreCard";
import ScoreBreakdown from "@/components/analysis/ScoreBreakdown";
import AISummary from "@/components/analysis/AISummary";
import RequirementList from "@/components/analysis/RequirementList";
import InsightSection from "@/components/analysis/InsightSection";

import {
  getAnalysis,
  AnalysisResult,
} from "@/lib/analysis";

export default function AnalysisPage() {
  const params = useParams();

  const router = useRouter();

  const analysisId =
    params.analysisId as string;

  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const result =
          await getAnalysis(
            analysisId
          );

        setAnalysis(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load analysis."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="icon-tile mx-auto flex h-14 w-14 bg-violet-500/15 text-fuchsia-300">
              <Loader2
                size={24}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-white">
              Loading analysis...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
          <div className="panel w-full border-rose-500/30 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/15 text-rose-300">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold text-white">
              Unable to load analysis
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {error ||
                "The requested analysis could not be found."}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/analyses/new"
                )
              }
              className="btn-primary mt-6 px-5 py-3"
            >
              <RefreshCw size={16} />
              Create new analysis
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const result = analysis.result;

  const requirements =
    (result.requirements ||
      []) as Array<{
      requirement: string;
      category: string;
      importance: string;
      matched: boolean;
      evidence?: string | null;
      relevance: number;
    }>;

  const strengths =
    result.strengths || [];

  const weaknesses =
    result.weaknesses || [];

  const recommendations =
    result.recommendations || [];

  const scores = analysis.result.scores;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Link
                href="/dashboard"
                className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-fuchsia-300"
              >
                <ArrowLeft size={15} />

                Dashboard
              </Link>

              <div className="flex items-center gap-2">
                <span className="icon-tile flex h-8 w-8 bg-violet-500/15 text-fuchsia-300">
                  <Sparkles size={15} />
                </span>

                <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                  Resume analysis
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your resume <span className="gradient-text">insights</span>
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                AI-powered comparison and deterministic
                scoring for your target role.
              </p>
            </div>

            <button
              type="button"
              className="btn-ghost"
            >
              <Download size={16} />

              Export
            </button>
          </div>
        </div>

        {/* Score cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <ScoreCard
            title="Overall score"
            score={
              analysis.overall_score
            }
            description="Combined resume analysis score"
            type="overall"
          />

          <ScoreCard
            title="Job match"
            score={
              analysis.job_match_score
            }
            description="How closely your resume matches the role"
            type="match"
          />

          <ScoreCard
            title="ATS score"
            score={
              analysis.ats_score
            }
            description="Keyword and requirement alignment"
            type="ats"
          />
        </section>

        {/* Breakdown + summary */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ScoreBreakdown
  scores={{
    skill_score: scores?.skill_score ?? 0,
    experience_score: scores?.experience_score ?? 0,
    responsibility_score:
      scores?.responsibility_score ?? 0,
    ats_score: scores?.ats_score ?? 0,
    education_score:
      scores?.education_score ?? 0,
  }}
/>

          <AISummary
            summary={
              result.summary ||
              "No summary was generated."
            }
          />
        </section>

        {/* Requirements */}
        <section className="mt-6">
          <RequirementList
            requirements={
              requirements
            }
          />
        </section>

        {/* Insights */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <InsightSection
            title="Strengths"
            items={strengths}
            type="strengths"
          />

          <InsightSection
            title="Areas to improve"
            items={weaknesses}
            type="weaknesses"
          />

          <InsightSection
            title="Recommendations"
            items={recommendations}
            type="recommendations"
          />
        </section>

        {/* Footer */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles
              size={18}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                About this analysis
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI identifies and evaluates evidence from
                your resume. Scores are calculated by the
                application's deterministic scoring engine
                rather than generated directly by the model.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

