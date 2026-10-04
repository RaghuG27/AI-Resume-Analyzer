"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import JobDescriptionForm from "@/components/jobs/JobDescriptionForm";
import { getJobs, JobResponse } from "@/lib/jobs";

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        const data = await getJobs();

        if (active) {
          setJobs(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load jobs."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function handleCreated() {
    setShowForm(false);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  function toggleJob(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function analyzeJob(id: string) {
    router.push(`/analyses/new?jobId=${id}`);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Jobs
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Your saved job descriptions. Click a job to analyse
              it against a resume.
            </p>
          </div>

          <button
            onClick={() => setShowForm((value) => !value)}
            className={
              showForm
                ? "btn-ghost shrink-0 px-4 py-2.5"
                : "btn-primary shrink-0 px-4 py-2.5"
            }
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New job
              </>
            )}
          </button>
        </div>

        {/* Add job form */}
        {showForm && (
          <section className="panel mt-6 p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="icon-tile flex h-10 w-10">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Add a job description
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Paste the role you&apos;re targeting.
                </p>
              </div>
            </div>

            <JobDescriptionForm onCreated={handleCreated} />
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              Loading jobs...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && !showForm && (
          <div className="panel mt-6 flex flex-col items-center px-6 py-16 text-center">
            <div className="icon-tile flex h-14 w-14">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              No jobs yet
            </h2>

            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              Add a job description to start matching it against
              your resumes.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-6 px-5 py-2.5"
            >
              <Plus className="h-4 w-4" />
              Add job
            </button>
          </div>
        )}

        {/* Jobs list */}
        {!loading && jobs.length > 0 && (
          <div className="mt-6 space-y-3">
            {jobs.map((job) => {
              const isOpen = expandedId === job.id;

              return (
                <div key={job.id} className="panel overflow-hidden">
                  {/* Row */}
                  <button
                    onClick={() => toggleJob(job.id)}
                    className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
                  >
                    <div className="icon-tile flex h-11 w-11 shrink-0">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-900">
                        {job.title}
                      </h3>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        ID: {job.id}
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded detail + analyse action */}
                  {isOpen && (
                    <div className="border-t border-slate-100 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Description
                      </p>

                      <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {job.description}
                      </p>

                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={() => analyzeJob(job.id)}
                          className="btn-primary group px-5 py-2.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          Analyse this job
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
