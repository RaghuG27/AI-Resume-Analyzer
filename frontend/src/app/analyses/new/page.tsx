"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Loader2,
  Sparkles,
  Target,
  AlertCircle,
} from "lucide-react";

import Link from "next/link";

import AppShell from "@/components/layout/AppShell";

import {
  getResumes,
  ResumeResponse,
} from "@/lib/resume";

import {
  getJobs,
  JobResponse,
} from "@/lib/jobs";

import {
  createAnalysis,
} from "@/lib/analysis";

function NewAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobIdParam = searchParams.get("jobId");
  const resumeIdParam = searchParams.get("resumeId");

  const [resumes, setResumes] =
    useState<ResumeResponse[]>([]);

  const [jobs, setJobs] =
    useState<JobResponse[]>([]);

  const [selectedResume, setSelectedResume] =
    useState("");

  const [selectedJob, setSelectedJob] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          resumeData,
          jobData,
        ] = await Promise.all([
          getResumes(),
          getJobs(),
        ]);

        setResumes(resumeData);
        setJobs(jobData);

        if (resumeData.length > 0) {
          const preselectedResume =
            resumeIdParam &&
            resumeData.some(
              (resume) => resume.id === resumeIdParam
            )
              ? resumeIdParam
              : resumeData[0].id;

          setSelectedResume(preselectedResume);
        }

        if (jobData.length > 0) {
          const preselectedJob =
            jobIdParam &&
            jobData.some((job) => job.id === jobIdParam)
              ? jobIdParam
              : jobData[0].id;

          setSelectedJob(preselectedJob);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load your resumes and jobs."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [jobIdParam, resumeIdParam]);

  async function handleAnalyze() {
    if (!selectedResume) {
      setError(
        "Please select a resume."
      );
      return;
    }

    if (!selectedJob) {
      setError(
        "Please select a job description."
      );
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const analysis =
        await createAnalysis({
          resume_id: selectedResume,
          job_id: selectedJob,
        });

      router.push(
        `/analyses/processing/${analysis.task_id}`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start analysis."
      );

      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="icon-tile mx-auto flex h-14 w-14 border border-slate-200 bg-slate-50 text-slate-400">
              <Loader2
                size={24}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-900">
              Loading your workspace
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Finding your resumes and jobs...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={15} />

          Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Sparkles size={22} />
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create an <span className="text-slate-900">analysis</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Select a resume and a target job.
            We'll compare them using our AI analysis
            pipeline.
          </p>
        </div>

        {/* Selection */}
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">

          {/* Resume */}
          <SelectionCard
            title="Your resume"
            subtitle="Select the resume you want to analyze"
            icon={FileText}
            iconClass="bg-slate-50 text-slate-700"
          >
            {resumes.length === 0 ? (
              <EmptyState
                text="No resumes uploaded yet."
                href="/resumes"
                action="Upload resume"
              />
            ) : (
              <select
                value={selectedResume}
                onChange={(event) =>
                  setSelectedResume(
                    event.target.value
                  )
                }
                className="field px-4 py-3 text-sm font-medium [&>option]:bg-white [&>option]:text-slate-900"
              >
                {resumes.map((resume) => (
                  <option
                    key={resume.id}
                    value={resume.id}
                  >
                    {resume.original_filename}
                  </option>
                ))}
              </select>
            )}
          </SelectionCard>

          {/* VS */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
            VS
          </div>

          {/* Job */}
          <SelectionCard
            title="Target job"
            subtitle="Select the position you're targeting"
            icon={BriefcaseBusiness}
            iconClass="bg-slate-50 text-slate-700"
          >
            {jobs.length === 0 ? (
              <EmptyState
                text="No jobs added yet."
                href="/jobs"
                action="Add job"
              />
            ) : (
              <select
                value={selectedJob}
                onChange={(event) =>
                  setSelectedJob(
                    event.target.value
                  )
                }
                className="field px-4 py-3 text-sm font-medium [&>option]:bg-white [&>option]:text-slate-900"
              >
                {jobs.map((job) => (
                  <option
                    key={job.id}
                    value={job.id}
                  >
                    {job.title}
                  </option>
                ))}
              </select>
            )}
          </SelectionCard>
        </div>

        {/* Selected status */}
        <div className="panel mt-6 p-5">
          <div className="flex items-start gap-3">
            <div className="icon-tile flex h-9 w-9 shrink-0 border border-slate-200 bg-slate-50 text-slate-700">
              <Target size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to analyze
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                The AI will identify job requirements,
                compare them with evidence in your resume,
                and calculate the analysis scores.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertCircle size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-rose-600">
                Unable to start analysis
              </p>

              <p className="mt-1 text-xs leading-5 text-rose-500">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Analyze */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={
              submitting ||
              resumes.length === 0 ||
              jobs.length === 0
            }
            className="btn-primary group w-full px-6 py-3.5 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Starting analysis...
              </>
            ) : (
              <>
                <Sparkles size={17} />

                Analyze resume

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewAnalysisPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex min-h-[70vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </AppShell>
      }
    >
      <NewAnalysisContent />
    </Suspense>
  );
}

interface SelectionCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
}

function SelectionCard({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  children,
}: SelectionCardProps) {
  return (
    <div className="panel-2 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 ${iconClass}`}
        >
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function EmptyState({
  text,
  href,
  action,
}: {
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
      <p className="text-xs text-slate-500">
        {text}
      </p>

      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700"
      >
        {action}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}