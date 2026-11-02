"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { getJobs, getSavedJobs, unsaveJob, JobResponse } from "@/lib/jobs";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [allJobs, saved] = await Promise.all([getJobs(), getSavedJobs()]);
      setJobs(allJobs.filter((job) => saved.items.some((item) => item.job_id === job.id)));
      setSavedIds(saved.items.map((item) => item.job_id));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load saved jobs."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function remove(id: string) {
    try {
      await unsaveJob(id);
      setSavedIds((ids) => ids.filter((item) => item !== id));
      setJobs((items) => items.filter((job) => job.id !== id));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not remove saved job."); }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-7"><div className="icon-tile flex h-12 w-12"><Bookmark size={21} /></div><h1 className="mt-4 text-3xl font-bold text-slate-900">Saved jobs</h1><p className="mt-2 text-sm text-slate-500">Jobs you bookmarked from the marketplace.</p></div>
        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {loading ? <ListSkeleton rows={4} /> :
          !savedIds.length ? <div className="panel p-10 text-center"><p className="font-semibold text-slate-900">No saved jobs yet</p><Link href="/jobs" className="mt-4 inline-flex btn-primary">Browse jobs</Link></div> :
          <div className="space-y-3">{jobs.map((job) => <article key={job.id} className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="icon-tile flex h-10 w-10"><BriefcaseBusiness size={18} /></div><div><h2 className="font-semibold text-slate-900">{job.title}</h2><p className="mt-1 text-xs text-slate-500">{job.location || "Location not specified"} · {job.employment_type || "Employment type not specified"}</p></div></div><button onClick={() => void remove(job.id)} className="btn-ghost"><Trash2 size={15} /> Remove saved</button></article>)}</div>
        }
      </div>
    </AppShell>
  );
}
