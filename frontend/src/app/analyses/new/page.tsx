"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getResumes, ResumeResponse } from "@/lib/resume";
import { createAnalysis } from "@/lib/analysis";
import { PageSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";

function NewAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [resumeId, setResumeId] = useState(searchParams.get("resumeId") ?? "");
  const [jobId, setJobId] = useState(searchParams.get("jobId") ?? "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getResumes()
      .then((items) => {
        setResumes(items);
        if (!resumeId && items.length) setResumeId(items[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load resumes."))
      .finally(() => setLoading(false));
  // Only load the resume list when the screen is first mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setError("");
    if (!resumeId) return setError("Select a resume first.");
    if (!jobId.trim()) return setError("Enter a job ID that belongs to your account.");
    setSubmitting(true);
    try {
      const result = await createAnalysis({ resume_id: resumeId, job_id: jobId.trim() });
      router.push(`/analyses/processing/${result.task_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start analysis.");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/analyses" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={15} /> Analyses</Link>
        <div className="mb-7">
          <div className="icon-tile flex h-12 w-12"><Sparkles size={22} /></div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Create an analysis</h1>
          <p className="mt-2 text-sm text-slate-500">Choose one of your uploaded resumes and provide the ID of a job description owned by your account.</p>
        </div>

        <div className="panel space-y-6 p-5 sm:p-7">
          {loading ? <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full" /></div> :
            resumes.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">You need to upload a resume before creating an analysis. <Link className="font-semibold text-violet-600" href="/resumes">Upload a resume</Link>.</div> :
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Resume</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="field h-12 pl-10 pr-3 text-sm">
                  {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_filename}</option>)}
                </select>
              </div>
            </div>
          }
          <div>
            <label htmlFor="job-id" className="mb-2 block text-sm font-semibold text-slate-800">Your job description ID</label>
            <input id="job-id" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Paste a job UUID owned by your account" className="field h-12 px-4 text-sm" />
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Backend limitation</p>
              <p className="mt-1">The supplied backend lets you list published company jobs, but analysis creation only accepts a job whose owner is your user account. It does not currently provide a personal job-description create/list endpoint. A marketplace job ID will normally be rejected by analysis creation.</p>
            </div>
          </div>
          {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={17} />{error}</div>}
          <button onClick={() => void submit()} disabled={loading || submitting || !resumes.length} className="btn-primary w-full">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Starting analysis...</> : <><Sparkles size={16} /> Start analysis</>}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewAnalysisPage() {
  return <Suspense fallback={<AppShell><PageSkeleton /></AppShell>}><NewAnalysisContent /></Suspense>;
}
