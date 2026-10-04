"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Target,
  Briefcase,
  GraduationCap,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  getAnalysis,
  AnalysisResult,
  getLearningPlan,
  AnalysisRequirement,
  LearningPlan,
} from "@/lib/analysis";
import LearningHub from "@/components/analysis/LearningHub";

function scoreText(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

function scoreBar(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    skill: "Skill",
    experience: "Experience",
    responsibility: "Responsibility",
    keyword: "ATS Keyword",
    education: "Education",
  };

  return labels[category] || category;
}

function RequirementCard({
  requirement,
}: {
  requirement: AnalysisRequirement;
}) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {requirement.matched ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          )}

          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900">
              {requirement.requirement}
            </h4>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {categoryLabel(requirement.category)}
              </span>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  requirement.importance === "required"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {requirement.importance === "required"
                  ? "Required"
                  : "Preferred"}
              </span>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  requirement.matched
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {requirement.matched ? "Matched" : "Missing"}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-medium text-slate-400">
            Relevance
          </p>

          <p
            className={`text-2xl font-semibold ${scoreText(
              requirement.relevance
            )}`}
          >
            {requirement.relevance}%
          </p>
        </div>
      </div>

      {requirement.evidence && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Resume Evidence
          </p>

          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {requirement.evidence}
          </p>
        </div>
      )}

      {!requirement.matched && (
        <div className="mt-4 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

          <p className="text-sm text-rose-700">
            No supporting evidence was identified in the
            resume for this requirement.
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  title,
  score,
  icon: Icon,
}: {
  title: string;
  score: number;
  icon: React.ElementType;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
          <Icon className="h-5 w-5" />
        </div>

        <span className={`text-2xl font-semibold ${scoreText(score)}`}>
          {score}%
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {title}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${scoreBar(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalysisResultPage() {
  const params = useParams();
  const router = useRouter();

  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [learningPlan, setLearningPlan] =
  useState<LearningPlan | null>(null);

const [learningLoading, setLearningLoading] =
  useState(true);

  useEffect(() => {
    if (!analysisId) {
      return;
    }

    async function loadAnalysis() {
  try {
    setLoading(true);
    setError("");

    const data =
      await getAnalysis(analysisId);

    setAnalysis(data);

    // Generate/load personalized learning material
    try {
      setLearningLoading(true);

      const plan =
        await getLearningPlan(analysisId);

      setLearningPlan(plan);
    } catch (learningError) {
      console.error(
        "Failed to load learning plan:",
        learningError
      );
    } finally {
      setLearningLoading(false);
    }
  } catch (error) {
    console.error(
      "Failed to load analysis:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to load analysis"
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
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            Loading analysis...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="panel max-w-md border-rose-200 p-6 text-center">
            <h2 className="font-semibold text-rose-700">
              Failed to load analysis
            </h2>

            <p className="mt-2 text-sm text-rose-600">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!analysis) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500">
          Analysis not found.
        </div>
      </AppShell>
    );
  }

  const result = analysis.result;

  const requirements = result.requirements ?? [];

  const requiredRequirements = requirements.filter(
    (item) => item.importance === "required"
  );

  const preferredRequirements = requirements.filter(
    (item) => item.importance === "preferred"
  );

  const missingRequirements = requirements.filter(
    (item) => !item.matched
  );

  const missingRequired = requiredRequirements.filter(
    (item) => !item.matched
  );

  const matchedRequirements = requirements.filter(
    (item) => item.matched
  );

  const skillRequirements = requirements.filter(
    (item) => item.category === "skill"
  );

  const missingSkills = skillRequirements.filter(
    (item) => !item.matched
  );

  const matchedSkills = skillRequirements.filter(
    (item) => item.matched
  );

  const scores = result.scores;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">

        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Resume Analysis
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Complete resume-to-job compatibility report
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="panel mt-8 flex flex-col items-start gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-slate-500">
              Overall Resume Match
            </p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-semibold tracking-tight text-slate-900">
                {analysis.overall_score}
              </span>

              <span className="mb-2 text-xl text-slate-400">
                / 100
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              This score is calculated from the requirement
              analysis, including skills, experience,
              responsibilities, ATS keywords, and education.
            </p>
          </div>

          <ScoreRing score={analysis.overall_score} />
        </div>

        {/* Score Breakdown */}
        <section className="mt-10">
          <SectionHeading
            title="Score Breakdown"
            subtitle="Detailed scoring across different aspects of the job requirements."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard
              title="Skills"
              score={scores?.skill_score ?? 0}
              icon={Target}
            />

            <ScoreCard
              title="Experience"
              score={scores?.experience_score ?? 0}
              icon={Briefcase}
            />

            <ScoreCard
              title="Responsibilities"
              score={scores?.responsibility_score ?? 0}
              icon={FileText}
            />

            <ScoreCard
              title="ATS Keywords"
              score={scores?.ats_score ?? analysis.ats_score}
              icon={Sparkles}
            />

            <ScoreCard
              title="Education"
              score={scores?.education_score ?? 0}
              icon={GraduationCap}
            />
          </div>
        </section>

        {/* AI Summary */}
        {result.summary && (
          <section className="panel mt-10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  AI Summary
                </h2>

                <p className="mt-2 leading-7 text-slate-600">
                  {result.summary}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Quick Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox
            label="Total Requirements"
            value={requirements.length}
          />

          <StatBox
            label="Matched Requirements"
            value={matchedRequirements.length}
            tone="emerald"
          />

          <StatBox
            label="Missing Requirements"
            value={missingRequirements.length}
            tone="rose"
          />

          <StatBox
            label="Missing Required"
            value={missingRequired.length}
            tone="amber"
          />
        </section>

        {/* Missing Skills */}
        <section className="mt-10">
          <SectionHeading
            title="Missing Skills"
            subtitle="Skills from the job description for which no supporting evidence was identified in your resume."
          />

          {missingSkills.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />

                <div>
                  <p className="font-semibold text-emerald-800">
                    No missing skills identified
                  </p>

                  <p className="mt-0.5 text-sm text-emerald-700">
                    The analysis found supporting evidence for
                    all identified skill requirements.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {missingSkills.map((skill, index) => (
                <div
                  key={`${skill.requirement}-${index}`}
                  className="panel p-5"
                >
                  <div className="flex items-start gap-3">
                    <XCircle
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        skill.importance === "required"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    />

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {skill.requirement}
                      </h3>

                      <span
                        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          skill.importance === "required"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {skill.importance === "required"
                          ? "Required Skill"
                          : "Preferred Skill"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Required Skills */}
        <section className="mt-10">
          <SectionHeading
            title="Required Skills"
            subtitle="Skills explicitly identified as required by the job description."
          />

          <div className="panel p-5">
            {requiredRequirements.length === 0 ? (
              <p className="text-sm text-slate-500">
                No required requirements were identified.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {requiredRequirements.map((requirement, index) => (
                  <div
                    key={`${requirement.requirement}-${index}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    {requirement.matched ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    )}

                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {requirement.requirement}
                      </p>

                      <p
                        className={`mt-0.5 text-xs font-medium ${
                          requirement.matched
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {requirement.matched
                          ? `${requirement.relevance}% relevance`
                          : "Missing"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Matched Skills */}
        <section className="mt-10">
          <SectionHeading
            title="Matched Skills"
            subtitle="Skills where the resume contains supporting evidence."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {matchedSkills.length === 0 ? (
              <div className="panel p-6 text-sm text-slate-500">
                No matched skills identified.
              </div>
            ) : (
              matchedSkills.map((skill, index) => (
                <div
                  key={`${skill.requirement}-${index}`}
                  className="panel p-5"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {skill.requirement}
                        </h3>

                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {skill.relevance}%
                        </span>
                      </div>

                      {skill.evidence && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {skill.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Strengths and Weaknesses */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Strengths */}
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Strengths
                </h2>

                <p className="text-sm text-slate-500">
                  Areas where your resume aligns well.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {(result.strengths ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  No strengths were identified.
                </p>
              ) : (
                result.strengths?.map((strength, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                    <p className="text-sm leading-6 text-slate-600">
                      {strength}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Weaknesses
                </h2>

                <p className="text-sm text-slate-500">
                  Areas that may need improvement.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {(result.weaknesses ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  No weaknesses were identified.
                </p>
              ) : (
                result.weaknesses?.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

                    <p className="text-sm leading-6 text-slate-600">
                      {weakness}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="panel mt-10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Lightbulb className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recommendations
              </h2>

              <p className="text-sm text-slate-500">
                Suggested improvements based on the analysis.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {(result.recommendations ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">
                No recommendations were generated.
              </p>
            ) : (
              result.recommendations?.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                    {index + 1}
                  </div>

                  <p className="text-sm leading-6 text-slate-600">
                    {recommendation}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Complete Requirement Analysis */}
        <section className="mt-10">
          <SectionHeading
            title="Complete Requirement Analysis"
            subtitle="Every requirement identified from the job description and the evidence found in your resume."
          />

          <div className="space-y-4">
            {requirements.length === 0 ? (
              <div className="panel p-6 text-sm text-slate-500">
                No requirements were returned by the analysis.
              </div>
            ) : (
              requirements.map((requirement, index) => (
                <RequirementCard
                  key={`${requirement.requirement}-${index}`}
                  requirement={requirement}
                />
              ))
            )}
          </div>
        </section>

        {/* Preferred Requirements */}
        <section className="mt-10">
          <SectionHeading
            title="Preferred Requirements"
            subtitle="Requirements identified as preferred rather than mandatory."
          />

          <div className="panel p-5">
            {preferredRequirements.length === 0 ? (
              <p className="text-sm text-slate-500">
                No preferred requirements were identified.
              </p>
            ) : (
              <div className="space-y-3">
                {preferredRequirements.map((requirement, index) => (
                  <div
                    key={`${requirement.requirement}-${index}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    {requirement.matched ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    )}

                    <div>
                      <p className="font-medium text-slate-900">
                        {requirement.requirement}
                      </p>

                      {requirement.evidence && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {requirement.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

         <section className="mt-6">
          <LearningHub
            learningPlan={learningPlan}
            loading={learningLoading}
          />
        </section>

        {/* Footer Metadata */}
        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-400">
            Analysis ID: {analysis.id}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Generated:{" "}
            {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "emerald" | "rose" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    amber: "text-amber-600",
  };

  return (
    <div className="panel p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div
      className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-3xl font-semibold text-slate-900">
          {score}%
        </p>
        <p className="mt-0.5 text-xs text-slate-400">Match</p>
      </div>
    </div>
  );
}
