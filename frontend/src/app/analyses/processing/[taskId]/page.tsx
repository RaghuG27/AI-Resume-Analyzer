"use client";

import {
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import {
  AlertCircle,
  Brain,
  CheckCircle2,
  FileSearch,
  Loader2,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

import {
  getAnalysisStatus,
  AnalysisStatusResponse,
} from "@/lib/analysis";

export default function AnalysisProcessingPage() {
  const params = useParams();

  const router = useRouter();

  const taskId = params.taskId as string;

  const [status, setStatus] =
    useState<AnalysisStatusResponse | null>(
      null
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function checkStatus() {
      try {
        const result =
          await getAnalysisStatus(taskId);

        setStatus(result);

        if (
          result.status === "SUCCESS" &&
          result.result?.analysis_id
        ) {
          clearInterval(interval);

          router.replace(
            `/analyses/${result.result.analysis_id}`
          );

          return;
        }

        if (
          result.status === "FAILURE"
        ) {
          clearInterval(interval);

          setError(
            result.error ||
              "Analysis failed."
          );
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to check analysis status."
        );
      }
    }

    checkStatus();

    interval = setInterval(
      checkStatus,
      2000
    );

    return () => {
      clearInterval(interval);
    };
  }, [taskId, router]);

  const currentStatus =
    status?.status || "PENDING";

  const isFailure =
    currentStatus === "FAILURE" ||
    Boolean(error);

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[75vh] w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">

          {!isFailure ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-600 text-white">
                <Brain
                  size={34}
                  className="animate-pulse"
                />
              </div>

              <div className="mt-7 text-center">
                <div className="chip border-slate-200 bg-slate-50 text-slate-500">
                  <Sparkles size={13} />

                  AI analysis in progress
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  Analyzing your <span className="text-slate-900">resume</span>
                </h1>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  We're comparing your resume with
                  the target job and identifying the
                  strongest matches and gaps.
                </p>
              </div>

              <div className="panel mt-10 p-5 sm:p-7">
                <StatusStep
                  icon={FileSearch}
                  title="Reading your resume"
                  description="Extracting relevant resume information"
                  active={
                    currentStatus ===
                    "STARTED"
                  }
                  complete={
                    currentStatus ===
                    "SUCCESS"
                  }
                />

                <StatusLine />

                <StatusStep
                  icon={Brain}
                  title="AI requirement matching"
                  description="Comparing job requirements with resume evidence"
                  active={
                    currentStatus ===
                    "STARTED"
                  }
                  complete={
                    currentStatus ===
                    "SUCCESS"
                  }
                />

                <StatusLine />

                <StatusStep
                  icon={Sparkles}
                  title="Calculating scores"
                  description="Generating your final analysis"
                  active={
                    currentStatus ===
                    "STARTED"
                  }
                  complete={
                    currentStatus ===
                    "SUCCESS"
                  }
                />
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2
                  size={13}
                  className="animate-spin"
                />

                Status:{" "}
                {currentStatus}
              </div>
            </>
          ) : (
            <div className="panel border-rose-200 p-7 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
                <AlertCircle size={28} />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-slate-900">
                Analysis couldn't be completed
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/analyses/new"
                  )
                }
                className="btn-primary mt-7 px-5 py-3"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

interface StatusStepProps {
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
}

function StatusStep({
  icon: Icon,
  title,
  description,
  active,
  complete,
}: StatusStepProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 ${
          complete
            ? "bg-emerald-50 text-emerald-600"
            : active
              ? "bg-violet-600 text-white"
              : "bg-slate-50 text-slate-400"
        }`}
      >
        {complete ? (
          <CheckCircle2 size={20} />
        ) : active ? (
          <Icon
            size={20}
            className="animate-pulse"
          />
        ) : (
          <Icon size={20} />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>

      {active && (
        <Loader2
          size={16}
          className="ml-auto shrink-0 animate-spin text-slate-400"
        />
      )}
    </div>
  );
}

function StatusLine() {
  return (
    <div className="ml-5 h-7 border-l border-dashed border-slate-200" />
  );
}