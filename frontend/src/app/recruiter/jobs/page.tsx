
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getMyCompanies, CompanyMembership } from "@/lib/companies";

import {
  closeCompanyJob,
  createJob,
  getMyCompanyJobs,
  JobResponse,
  publishCompanyJob,
} from "@/lib/jobs";

export default function RecruiterJobsPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [jobs, setJobs] = useState<JobResponse[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeCompanies = companies.filter(
    (company) => company.status === "active"
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();

      if (!user.is_active) {
        router.replace("/login");
        return;
      }

      if (user.role !== "recruiter") {
        router.replace(
          user.role === "admin" ? "/admin" : "/dashboard"
        );
        return;
      }

      const [companyData, jobData] = await Promise.all([
        getMyCompanies(),
        getMyCompanyJobs(),
      ]);

      setCompanies(companyData);
      setJobs(jobData);

      setCompanyId((current) => {
        if (current && companyData.some(
          (company) =>
            company.company_id === current &&
            company.status === "active"
        )) {
          return current;
        }

        return (
          companyData.find(
            (company) => company.status === "active"
          )?.company_id ?? ""
        );
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recruiter jobs."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!companyId) {
      setError("Select an approved company first.");
      return;
    }

    if (title.trim().length < 3) {
      setError("Job title must contain at least 3 characters.");
      return;
    }

    if (description.trim().length < 20) {
      setError("Job description must contain at least 20 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const created = await createJob(companyId, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        employment_type: employmentType,
      });

      const company = activeCompanies.find(
        (item) => item.company_id === companyId
      );

      setJobs((current) => [
        {
          ...created,
          company_name: company?.company_name ?? "",
          status: "draft",
        },
        ...current,
      ]);

      setTitle("");
      setDescription("");
      setLocation("");
      setEmploymentType("Full-time");
      setShowForm(false);

      setNotice("Job created successfully as a draft.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create job."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJobAction(
    job: JobResponse,
    action: "publish" | "close"
  ) {
    if (!job.company_id) {
      setError("This job is not associated with a company.");
      return;
    }

    const previousStatus = job.status;

    // Optimistic update: the UI responds immediately.
    const nextStatus = action === "publish" ? "published" : "closed";

    setJobs((current) =>
      current.map((item) =>
        item.id === job.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setActionId(job.id);
    setError("");
    setNotice("");

    try {
      if (action === "publish") {
        await publishCompanyJob(job.company_id, job.id);
        setNotice("Job published successfully.");
      } else {
        await closeCompanyJob(job.company_id, job.id);
        setNotice("Job closed successfully. Existing applications are preserved.");
      }
    } catch (err) {
      // Revert if the backend rejects the action.
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      setError(
        err instanceof Error ? err.message : "Job action failed."
      );
    } finally {
      setActionId(null);
    }
  }

  const draftCount = jobs.filter(
    (job) => job.status === "draft"
  ).length;

  const publishedCount = jobs.filter(
    (job) => job.status === "published"
  ).length;

  const closedCount = jobs.filter(
    (job) => job.status === "closed"
  ).length;

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">

        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
              <BriefcaseBusiness size={17} />
              Recruiter workspace
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Jobs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage jobs across your approved companies.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="btn-ghost"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              disabled={activeCompanies.length === 0}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} />
              Create job
            </button>
          </div>
        </header>

        {/* Feedback */}
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Draft jobs" value={draftCount} icon={<Clock size={20} />} />
          <SummaryCard label="Published jobs" value={publishedCount} icon={<Send size={20} />} />
          <SummaryCard label="Closed jobs" value={closedCount} icon={<XCircle size={20} />} />
        </section>

        {/* Company approval notice */}
        {companies.length === 0 && (
          <div className="panel p-6">
            <h2 className="font-semibold text-slate-900">
              Create a company first
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              You need a company membership approved by an administrator before you can create jobs.
            </p>
            <button
              type="button"
              onClick={() => router.push("/companies")}
              className="btn-primary mt-4"
            >
              <Building2 size={16} />
              Go to Companies
            </button>
          </div>
        )}

        {companies.length > 0 && activeCompanies.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-900">
              Company approval required
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Your company exists, but its membership is still pending. An administrator must approve it before job creation is enabled.
            </p>
          </div>
        )}

        {/* Create job form */}
        {showForm && activeCompanies.length > 0 && (
          <section className="panel p-5 sm:p-7">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Create a job
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the company that owns this job.
              </p>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Company *
                </label>
                <select
                  required
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="field px-3 py-3 text-sm"
                >
                  {activeCompanies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Job title *
                  </label>
                  <input
                    required
                    minLength={3}
                    maxLength={255}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Python Full Stack Developer"
                    className="field px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Job location
                  </label>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Bengaluru, India / Remote"
                    className="field px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Employment type
                </label>
                <select
                  value={employmentType}
                  onChange={(event) => setEmploymentType(event.target.value)}
                  className="field px-3 py-3 text-sm"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                  <option>Remote</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Job description *
                </label>
                <textarea
                  required
                  minLength={20}
                  maxLength={20000}
                  rows={8}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe responsibilities, requirements, skills and experience..."
                  className="field resize-y px-3 py-3 text-sm"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {description.length}/20000
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create draft job
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Jobs list */}
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              All company jobs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Jobs across all companies where you have active membership.
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="p-10 text-center">
              <BriefcaseBusiness size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">
                No jobs created yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first job using the button above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const expanded = expandedId === job.id;
                const busy = actionId === job.id;

                return (
                  <article key={job.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : job.id)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div className="icon-tile h-11 w-11 shrink-0">
                          <BriefcaseBusiness size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {job.company_name}
                          </p>
                          {job.location && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <MapPin size={13} />
                              {job.location}
                            </p>
                          )}
                        </div>

                        <ChevronDown
                          size={18}
                          className={`mt-1 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          job.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : job.status === "closed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {job.status}
                        </span>

                        {job.status === "draft" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleJobAction(job, "publish")}
                            className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            Publish
                          </button>
                        )}

                        {/* Always show Close for published jobs, regardless of application count. */}
                        {job.status === "published" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleJobAction(job, "close")}
                            className="btn-ghost px-3 py-2 text-xs text-rose-600 disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Close job
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {job.description}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="icon-tile h-10 w-10">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
