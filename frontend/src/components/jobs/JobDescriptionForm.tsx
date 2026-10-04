"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import {
  createJob,
  JobResponse,
} from "@/lib/jobs";

interface JobDescriptionFormProps {
  onCreated?: (
    job: JobResponse
  ) => void;
}

export default function JobDescriptionForm({
  onCreated,
}: JobDescriptionFormProps) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [job, setJob] =
    useState<JobResponse | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "Please enter a job title."
      );
      return;
    }

    if (description.trim().length < 20) {
      setError(
        "Job description must contain at least 20 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await createJob({
          title: title.trim(),
          description:
            description.trim(),
        });

      setJob(result);

      onCreated?.(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create job."
      );
    } finally {
      setLoading(false);
    }
  }

  if (job) {
    return (
      <div className="panel overflow-hidden">
        <div className="bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-600">
                Job description saved
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                {job.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your job description is ready to
                compare against a resume.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles
              size={14}
              className="text-slate-400"
            />

            Ready for resume analysis
          </div>

          <button
            type="button"
            className="btn-primary px-4 py-2.5"
          >
            Analyze resume
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Job title */}
      <div>
        <label
          htmlFor="job-title"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Job title
        </label>

        <div className="relative">
          <BriefcaseBusiness
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            id="job-title"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="e.g. Python Backend Developer"
            maxLength={255}
            className="field h-12 pl-11 pr-4 text-sm"
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Give the position a clear and recognizable name.
        </p>
      </div>

      {/* Description */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="job-description"
            className="text-sm font-semibold text-slate-900"
          >
            Job description
          </label>

          <span
            className={`text-xs ${
              description.length > 9000
                ? "text-rose-400"
                : "text-slate-500"
            }`}
          >
            {description.length} characters
          </span>
        </div>

        <div className="relative">
          <FileText
            size={18}
            className="absolute left-4 top-4 text-slate-500"
          />

          <textarea
            id="job-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder={`Paste the complete job description here...

Example:
• 3+ years of Python experience
• Strong Django / FastAPI knowledge
• Experience with PostgreSQL
• REST API development
• Docker and cloud experience`}
            className="field min-h-[280px] resize-y rounded-2xl px-11 py-4 text-sm leading-6"
          />
        </div>

        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Include responsibilities, requirements,
            skills and qualifications.
          </span>

          <span>
            Minimum 20 characters
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <AlertCircle size={17} />
          </div>

          <div>
            <p className="font-semibold">
              Couldn't save job
            </p>

            <p className="mt-1 text-xs leading-5 text-rose-500">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary group w-full px-5 py-3.5"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

            Saving job...
          </>
        ) : (
          <>
            <Sparkles size={17} />

            Save job description

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </>
        )}
      </button>
    </form>
  );
}