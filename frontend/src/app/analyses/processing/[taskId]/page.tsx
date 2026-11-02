"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Brain, CheckCircle2, FileSearch, Loader2, RefreshCw, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { getAnalysisStatus, AnalysisStatusResponse } from "@/lib/analysis";

export default function AnalysisProcessingPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = params.taskId;
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function checkStatus() {
    if (!taskId || checking) return;
    setChecking(true);
    try {
      const result = await getAnalysisStatus(taskId);
      setStatus(result);
      setError("");
      if (result.status === "SUCCESS" && result.result?.analysis_id) {
        router.replace(`/analyses/${result.result.analysis_id}`);
      } else if (result.status === "FAILURE") {
        setError(result.error || "The analysis task failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check task status.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkStatus();
    const timer = window.setInterval(() => { void checkStatus(); }, 2500);
    return () => window.clearInterval(timer);
  // checkStatus is intentionally called against the current task ID.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const currentStatus = status?.status ?? "PENDING";
  const failed = currentStatus === "FAILURE";

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-4 py-10">
        {failed ? (
          <div className="panel w-full p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertCircle size={26} /></div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Analysis could not be completed</h1>
            <p className="mt-3 text-sm text-slate-500">{error || "The background task reported a failure."}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => void checkStatus()} className="btn-ghost"><RefreshCw size={15} /> Check again</button>
              <button onClick={() => router.push("/analyses/new")} className="btn-primary">Back to analysis</button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-600 text-white"><Brain size={34} className="animate-pulse" /></div>
            <div className="mt-7 text-center">
              <span className="chip"><Sparkles size={13} /> Background analysis</span>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Analyzing your resume</h1>
              <p className="mt-3 text-sm text-slate-500">Your analysis runs asynchronously. This page checks the task status and opens the report when it succeeds.</p>
            </div>
            <div className="panel mt-9 space-y-5 p-6">
              <StatusStep icon={FileSearch} title="Resume and job data" active={currentStatus === "STARTED"} complete={currentStatus === "SUCCESS"} />
              <StatusStep icon={Brain} title="Requirement matching" active={currentStatus === "STARTED"} complete={currentStatus === "SUCCESS"} />
              <StatusStep icon={Sparkles} title="Score calculation and report" active={currentStatus === "STARTED"} complete={currentStatus === "SUCCESS"} />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              {checking ? <Loader2 size={14} className="animate-spin" /> : null}
              Task status: {currentStatus} · Worker status: {status?.celery_status ?? "Checking"}
            </p>
            {error && <p className="mt-3 text-center text-xs text-amber-700">{error} — retrying automatically.</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusStep({ icon: Icon, title, active, complete }: { icon: React.ElementType; title: string; active: boolean; complete: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${complete ? "bg-emerald-50 text-emerald-600" : active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"}`}>
        {complete ? <CheckCircle2 size={19} /> : <Icon size={19} className={active ? "animate-pulse" : ""} />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {active && <Loader2 size={15} className="ml-auto animate-spin text-violet-500" />}
    </div>
  );
}
