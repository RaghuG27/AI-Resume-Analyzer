
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { CardGridSkeleton } from "@/components/ui/LoadingSkeleton";

import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

import {
  getJobs,
  JobResponse,
  saveJob,
} from "@/lib/jobs";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

interface SavedJobItem {
  id: string;
  job_id: string;
}

interface CandidateApplication {
  id: string;
  job_id: string;
  status: string;
}

type ActionKey = `${string}:save` | `${string}:apply`;

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobResponse[]>([]);

  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set()
  );

  const [appliedIds, setAppliedIds] = useState<Set<string>>(
    new Set()
  );

  const [expandedId, setExpandedId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [pendingActions, setPendingActions] = useState<Set<ActionKey>>(() => new Set());

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ------------------------------------------------------
  // LOAD MARKETPLACE
  // ------------------------------------------------------

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();

      if (!user.is_active) {
        router.replace("/login");
        return;
      }

      if (user.role !== "candidate") {
        router.replace(
          user.role === "admin"
            ? "/admin"
            : "/recruiter"
        );
        return;
      }

      // Fetch independent marketplace resources concurrently.
      // A saved-jobs or applications failure must not block job discovery.
      const [jobsResult, savedResult, applicationResult] =
        await Promise.allSettled([
          getJobs(),
          apiFetch<{ items: SavedJobItem[] }>("/api/jobs/saved/me"),
          apiFetch<CandidateApplication[]>("/api/applications/me"),
        ]);

      if (jobsResult.status === "fulfilled") {
        setJobs(jobsResult.value);
      } else {
        throw jobsResult.reason;
      }

      if (savedResult.status === "fulfilled") {
        setSavedIds(
          new Set(
            savedResult.value.items.map(
              (item) => item.job_id
            )
          )
        );
      } else {
        console.error(
          "Failed to load saved jobs:",
          savedResult.reason
        );
      }

      if (applicationResult.status === "fulfilled") {
        setAppliedIds(
          new Set(
            applicationResult.value.map(
              (item) => item.job_id
            )
          )
        );
      } else {
        console.error(
          "Failed to load applications:",
          applicationResult.reason
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load published jobs."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadMarketplace();
  }, [loadMarketplace]);

  // ------------------------------------------------------
  // SEARCH
  // ------------------------------------------------------

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return jobs;

    return jobs.filter((job) => {
      const searchableValues = [
        job.title,
        job.company_name ?? "",
        job.location ?? "",
        job.employment_type ?? "",
        job.description ?? "",
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(term)
      );
    });
  }, [jobs, search]);

  // ------------------------------------------------------
  // EXPAND / COLLAPSE DESCRIPTION
  // ------------------------------------------------------

  function toggleDescription(jobId: string) {
    setExpandedId((current) =>
      current === jobId ? null : jobId
    );
  }

  // ------------------------------------------------------
  // SAVE JOB
  // ------------------------------------------------------

  async function handleSave(job: JobResponse) {
    if (savedIds.has(job.id)) return;

    const actionKey: ActionKey = `${job.id}:save`;
    if (pendingActions.has(actionKey)) return;

    setError("");
    setNotice("");

    setPendingActions((current) => new Set(current).add(actionKey));

    // Optimistic update.
    setSavedIds((current) => {
      const updated = new Set(current);
      updated.add(job.id);
      return updated;
    });

    try {
      await saveJob(job.id);

      setNotice(
        `"${job.title}" added to your saved jobs.`
      );
    } catch (err) {
      // Roll back on failure.
      setSavedIds((current) => {
        const updated = new Set(current);
        updated.delete(job.id);
        return updated;
      });

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save this job."
      );
    } finally {
      setPendingActions((current) => { const next = new Set(current); next.delete(actionKey); return next; });
    }
  }

  // ------------------------------------------------------
  // APPLY FOR JOB
  // ------------------------------------------------------

  async function handleApply(job: JobResponse) {
    if (appliedIds.has(job.id)) return;

    const actionKey: ActionKey = `${job.id}:apply`;
    if (pendingActions.has(actionKey)) return;

    setError("");
    setNotice("");

    setPendingActions((current) => new Set(current).add(actionKey));

    // Optimistic update.
    setAppliedIds((current) => {
      const updated = new Set(current);
      updated.add(job.id);
      return updated;
    });

    try {
      await apiFetch(
        `/api/jobs/${job.id}/applications`,
        {
          method: "POST",
          body: JSON.stringify({
            cover_letter: null,
          }),
        }
      );

      setNotice(
        `Your application for "${job.title}" was submitted successfully.`
      );
    } catch (err) {
      // Roll back on failure.
      setAppliedIds((current) => {
        const updated = new Set(current);
        updated.delete(job.id);
        return updated;
      });

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your application."
      );
    } finally {
      setPendingActions((current) => { const next = new Set(current); next.delete(actionKey); return next; });
    }
  }

  // ------------------------------------------------------
  // ANALYZE RESUME
  // ------------------------------------------------------

  function handleAnalyze(job: JobResponse) {
    // The job ID is an internal reference.
    // The backend must load the actual job title and
    // description using this ID for analysis.
    //
    // The candidate does not need to enter a job ID.

    const params = new URLSearchParams({
      jobId: job.id,
    });

    router.push(`/analyses/new?${params.toString()}`);
  }

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">

        {/* HEADER */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
              <BriefcaseBusiness size={17} />
              Candidate marketplace
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Explore Jobs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Discover opportunities, save interesting jobs
              and compare them with your resume.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadMarketplace()}
            disabled={loading}
            className="btn-ghost"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </header>

        {/* SEARCH */}
        <div className="relative">

          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by job title, company, skills or location..."
            className="field py-3 pl-10 pr-4 text-sm"
          />

        </div>

        {/* NOTIFICATIONS */}
        {notice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <CardGridSkeleton cards={6} />
        ) : filteredJobs.length === 0 ? (

          /* EMPTY STATE */
          <div className="panel p-12 text-center">

            <BriefcaseBusiness
              size={36}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 font-semibold text-slate-900">
              {search
                ? "No matching jobs found"
                : "No jobs available"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Published opportunities will appear here when recruiters post them."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-800"
              >
                Clear search
              </button>
            )}

          </div>

        ) : (

          /* JOB LIST */
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                {filteredJobs.length} published opportunities
              </p>
            </div>

            {filteredJobs.map((job) => {
              const expanded = expandedId === job.id;
              const saved = savedIds.has(job.id);
              const applied = appliedIds.has(job.id);

              const saving = pendingActions.has(`${job.id}:save`);
              const applying = pendingActions.has(`${job.id}:apply`);

              return (
                <article
                  key={job.id}
                  className="panel overflow-hidden transition-all duration-200 hover:shadow-md"
                >

                  {/* JOB HEADER */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleDescription(job.id)
                    }
                    aria-expanded={expanded}
                    aria-controls={`job-description-${job.id}`}
                    className="flex w-full cursor-pointer items-start gap-4 p-5 text-left transition hover:bg-slate-50"
                  >

                    <div className="icon-tile flex h-12 w-12 shrink-0 items-center justify-center">
                      <BriefcaseBusiness size={21} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <h2 className="font-semibold text-slate-900">
                        {job.title}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {job.company_name || "Company"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">

                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />
                            {job.location}
                          </span>
                        )}

                        {job.employment_type && (
                          <span>
                            {job.employment_type}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* EXPAND ARROW */}
                    <div className="flex shrink-0 items-center gap-1 pt-1 text-xs text-slate-400">

                      <span className="hidden sm:block">
                        {expanded ? "Hide details" : "View details"}
                      </span>

                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />

                    </div>

                  </button>

                  {/* JOB DESCRIPTION */}
                  {expanded && (
                    <div
                      id={`job-description-${job.id}`}
                      className="border-t border-slate-100 p-5"
                    >

                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Job Description
                      </h3>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                        {job.description}
                      </p>

                      {/* ACTION BUTTONS */}
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

                        {/* SAVE */}
                        <button
                          type="button"
                          disabled={saved || saving}
                          onClick={() =>
                            void handleSave(job)
                          }
                          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {saving ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : saved ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Bookmark size={16} />
                          )}

                          {saving
                            ? "Saving..."
                            : saved
                              ? "Saved"
                              : "Save"}

                        </button>

                        {/* APPLY */}
                        <button
                          type="button"
                          disabled={applied || applying}
                          onClick={() =>
                            void handleApply(job)
                          }
                          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {applying ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : applied ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <ArrowRight size={16} />
                          )}

                          {applying
                            ? "Applying..."
                            : applied
                              ? "Applied"
                              : "Apply"}

                        </button>

                        {/* ANALYZE */}
                        <button
                          type="button"
                          onClick={() =>
                            handleAnalyze(job)
                          }
                          className="btn-ghost text-violet-700 hover:bg-violet-50"
                        >

                          <Sparkles size={16} />

                          Analyze Resume

                        </button>

                      </div>

                      {/* ACTION INFO */}
                      {applied && (
                        <p className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                          <CheckCircle2 size={14} />
                          You have already applied for this position.
                        </p>
                      )}

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>
    </AppShell>
  );
}
