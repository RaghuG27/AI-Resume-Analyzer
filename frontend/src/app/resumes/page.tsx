
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FileText,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import ResumeUploader from "@/components/resume/ResumeUploader";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { getCurrentUser, UserRole } from "@/lib/auth";

import {
  getResumeFile,
  getResumes,
  ResumeResponse,
} from "@/lib/resume";

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openingResumeId, setOpeningResumeId] =
    useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load resumes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void getCurrentUser().then((user) => setUserRole(user.role)).catch(() => setUserRole(null));
  }, [load]);

  // Open the original uploaded resume.
  const handleOpenResume = async (resume: ResumeResponse) => {
    if (openingResumeId) return;

    // Open a blank tab immediately to avoid popup blockers.
    const previewTab = window.open("about:blank", "_blank");

    if (!previewTab) {
      setError(
        "Your browser blocked the resume preview. Please allow pop-ups and try again."
      );
      return;
    }

    previewTab.document.title = "Opening resume...";

    previewTab.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:24px;color:#475569;">Opening your resume...</p>';

    setOpeningResumeId(resume.id);
    setError("");

    try {
      const blob = await getResumeFile(resume.id);

      const fileUrl = URL.createObjectURL(blob);

      previewTab.location.href = fileUrl;

      // Keep the object URL alive while the preview is open.
    } catch (err) {
      previewTab.close();

      setError(
        err instanceof Error
          ? err.message
          : "Unable to open this resume."
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-700">RESUME LIBRARY</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Your resumes
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your uploaded resumes and start an analysis whenever you're ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploader((visible) => !visible)}
            className="btn-primary shrink-0 self-start sm:self-auto"
            aria-expanded={showUploader}
          >
            {showUploader ? <X size={17} /> : <UploadCloud size={17} />}
            {showUploader ? "Close upload" : "Upload resume"}
          </button>
        </div>

        {showUploader && (
          <section className="panel mb-8 p-5 sm:p-7">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">Add a resume</h2>
              <p className="mt-1 text-sm text-slate-500">PDF or DOCX files are supported.</p>
            </div>
            <ResumeUploader onUploaded={() => void load()} />
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All resumes</h2>
              <p className="mt-1 text-sm text-slate-500">
                {resumes.length} {resumes.length === 1 ? "file" : "files"} in your library
              </p>
            </div>
            <button
              onClick={() => void load()}
              className="btn-ghost"
              disabled={loading}
              aria-label="Refresh resumes"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <ListSkeleton rows={4} />
          ) : resumes.length === 0 ? (

            <div className="panel rounded-2xl px-6 py-16 text-center">
              <div className="icon-tile mx-auto flex h-12 w-12 items-center justify-center">
                <FileText size={21} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">No resumes yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Upload a PDF or DOCX to keep it here and use it for analysis.
              </p>
              <button type="button" onClick={() => setShowUploader(true)} className="btn-primary mt-5">
                <UploadCloud size={16} /> Upload your first resume
              </button>
            </div>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex flex-col gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >

                  {/* File information */}
                  <div className="flex min-w-0 items-center gap-3">

                    {/* Clickable file icon */}
                    <button
                      type="button"
                      onClick={() => void handleOpenResume(resume)}
                      disabled={openingResumeId !== null}
                      title={`Open ${resume.original_filename}`}
                      aria-label={`Open uploaded resume ${resume.original_filename}`}
                      className="icon-tile flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl transition hover:bg-violet-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      {openingResumeId === resume.id ? (
                        <RefreshCw
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <FileText size={19} />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {resume.original_filename}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(
                          resume.created_at
                        ).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:justify-end">

                    <button
                      onClick={() => router.push(`/analyses/new?resumeId=${encodeURIComponent(resume.id)}`)}
                      className="btn-ghost"
                    >
                      <Sparkles size={15} />
                      Analyze
                    </button>

                    {userRole === "recruiter" && (
                      <button
                        onClick={() => router.push(`/candidates?resumeId=${encodeURIComponent(resume.id)}`)}
                        className="btn-primary"
                      >
                        Create candidate profile
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>

          )}
        </section>
      </div>
    </AppShell>
  );
}
