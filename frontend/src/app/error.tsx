"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page could not be loaded. Your data has not been intentionally changed.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary mt-5"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
