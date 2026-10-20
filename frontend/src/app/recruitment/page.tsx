"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  RefreshCw,
  Search,
  UserRound,
  AlertCircle,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

type Status =
  | "applied"
  | "shortlisted"
  | "interview"
  | "selected"
  | "rejected";

type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_title: string | null;
  job_title: string;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STAGES: {
  id: Status;
  label: string;
  color: string;
  badge: string;
}[] = [
  {
    id: "applied",
    label: "Applied",
    color: "border-slate-300",
    badge: "bg-slate-100 text-slate-700",
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    color: "border-violet-400",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    id: "interview",
    label: "Interview",
    color: "border-blue-400",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    id: "selected",
    label: "Selected",
    color: "border-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "border-rose-400",
    badge: "bg-rose-100 text-rose-700",
  },
];

const TRANSITIONS: Record<Status, Status[]> = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["selected", "rejected"],
  selected: [],
  rejected: [],
};

export default function RecruitmentPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/recruitment/applications/?limit=100`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Please sign in to view your recruitment pipeline."
            : "Unable to load applications."
        );
      }

      const data: Application[] = await response.json();
      setApplications(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return applications;

    return applications.filter((application) =>
      [
        application.candidate_name,
        application.candidate_email ?? "",
        application.candidate_title ?? "",
        application.job_title,
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [applications, search]);

  async function moveApplication(
    application: Application,
    newStatus: Status
  ) {
    if (!TRANSITIONS[application.status].includes(newStatus)) return;

    setUpdatingId(application.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/recruitment/applications/${application.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            notes: `Moved from ${application.status} to ${newStatus}`,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail ?? "Could not update the application status."
        );
      }

      setNotice(
        `${application.candidate_name} moved to ${
          STAGES.find((stage) => stage.id === newStatus)?.label
        }.`
      );

      await loadApplications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status update failed."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
              <BriefcaseBusiness size={17} />
              Talent management
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Recruitment Pipeline
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track candidates and move applications through your hiring process.
            </p>
          </div>

          <button
            onClick={() => void loadApplications()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STAGES.map((stage) => {
            const count = applications.filter(
              (application) => application.status === stage.id
            ).length;

            return (
              <div
                key={stage.id}
                className={`rounded-2xl border-l-4 ${stage.color} bg-white p-4 shadow-sm`}
              >
                <p className="text-sm text-slate-500">{stage.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {count}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {count === 1 ? "application" : "applications"}
                </p>
              </div>
            );
          })}
        </section>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-lg flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidates, skills titles, or jobs..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="text-sm text-slate-500">
            {filteredApplications.length} applications
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={22} className="animate-spin" />
            Loading recruitment pipeline...
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
            {STAGES.map((stage) => {
              const stageApplications = filteredApplications.filter(
                (application) => application.status === stage.id
              );

              return (
                <section
                  key={stage.id}
                  className="min-w-0 rounded-2xl bg-slate-100/80 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="font-semibold text-slate-800">
                      {stage.label}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${stage.badge}`}
                    >
                      {stageApplications.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageApplications.map((application) => {
                      const nextStatuses = TRANSITIONS[application.status];

                      return (
                        <article
                          key={application.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700">
                            <UserRound size={20} />
                          </div>

                          <h3 className="break-words font-semibold text-slate-900">
                            {application.candidate_name}
                          </h3>

                          <p className="mt-1 break-words text-xs text-slate-500">
                            {application.candidate_title || "Title not provided"}
                          </p>

                          {application.candidate_email && (
                            <p className="mt-2 break-all text-xs text-slate-500">
                              {application.candidate_email}
                            </p>
                          )}

                          <div className="mt-4 rounded-lg bg-slate-50 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Applied for
                            </p>
                            <p className="mt-1 break-words text-sm font-medium text-slate-700">
                              {application.job_title}
                            </p>
                          </div>

                          {application.notes && (
                            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                              {application.notes}
                            </p>
                          )}

                          {nextStatuses.length > 0 && (
                            <div className="mt-4 border-t border-slate-100 pt-3">
                              <label
                                htmlFor={`move-${application.id}`}
                                className="mb-2 block text-xs font-medium text-slate-500"
                              >
                                Move to stage
                              </label>

                              <select
                                id={`move-${application.id}`}
                                value=""
                                disabled={updatingId === application.id}
                                onChange={(event) => {
                                  const value = event.target.value as Status;
                                  if (value) {
                                    void moveApplication(application, value);
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-violet-400 disabled:opacity-50"
                              >
                                <option value="">Select stage...</option>
                                {nextStatuses.map((nextStatus) => (
                                  <option key={nextStatus} value={nextStatus}>
                                    {STAGES.find(
                                      (item) => item.id === nextStatus
                                    )?.label}
                                  </option>
                                ))}
                              </select>

                              {updatingId === application.id && (
                                <p className="mt-2 flex items-center gap-1 text-xs text-violet-600">
                                  <LoaderCircle
                                    size={13}
                                    className="animate-spin"
                                  />
                                  Updating...
                                </p>
                              )}
                            </div>
                          )}

                          {nextStatuses.length === 0 && (
                            <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
                              <ArrowRight size={13} />
                              Final stage
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {stageApplications.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center">
                        <p className="text-sm text-slate-400">
                          No applications
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}