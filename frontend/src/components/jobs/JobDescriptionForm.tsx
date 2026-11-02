"use client";

import { AlertTriangle, FileText } from "lucide-react";

export default function JobDescriptionForm() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle size={19} />
        </div>
        <div>
          <h3 className="font-semibold text-amber-950">Personal job descriptions are not available through the current API</h3>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            The backend currently supports published company jobs and company-owned draft job creation. It does not expose an endpoint to create or list a job description owned by your candidate account. The analysis API requires that ownership, so this form is intentionally not wired to the company-job endpoint.
          </p>
          <a href="/jobs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline">
            <FileText size={15} /> Browse published jobs
          </a>
        </div>
      </div>
    </div>
  );
}
