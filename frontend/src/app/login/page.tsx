
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import {
  login,
  getCurrentUser,
  getPostLoginPath,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Prevent multiple login requests.
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // Step 1: Authenticate user.
      await login({
        email: email.trim(),
        password,
      });

      // Step 2: Retrieve authenticated user details.
      const user = await getCurrentUser();

      // Step 3: Validate account status.
      if (!user.is_active) {
        throw new Error(
          "Your account is inactive. Please contact the administrator."
        );
      }

      // Step 4: Determine destination based on role.
      const destination = getPostLoginPath(user);

      // Step 5: Navigate to the appropriate dashboard.
      // Keep loading active during navigation.
      router.replace(destination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );

      // Hide loading only when login fails.
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen">

      {/* Full-screen authentication loading overlay */}
      {loading && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Signing in and preparing your dashboard"
        >
          <div className="flex flex-col items-center">

            {/* Animated logo */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
              <FileText className="h-8 w-8" />
            </div>

            {/* Spinner */}
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-violet-600" />
            </div>

            {/* Loading message */}
            <h2 className="mt-6 text-lg font-semibold text-slate-900">
              Signing you in...
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Preparing your ResumeAI workspace
            </p>

            {/* Animated progress indicator */}
            <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-violet-600" />
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Please wait. Do not close this window.
            </p>
          </div>
        </div>
      )}

      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-violet-600 p-12 text-white lg:flex">

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <FileText className="h-5 w-5" />
          </div>

          <span className="text-lg font-bold">
            Resume<span className="text-violet-200">AI</span>
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Turn your resume into a career advantage.
          </h1>

          <p className="mt-4 leading-7 text-violet-100">
            Analyze your resume against real job descriptions and
            get AI-powered insights into skills, experience and
            areas to improve.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-violet-50">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-200" />
              Evidence-based requirement matching
            </li>

            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-200" />
              ATS keyword and scoring breakdown
            </li>

            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-200" />
              Actionable recommendations
            </li>
          </ul>
        </div>

        <p className="text-sm text-violet-200">
          Secure access to your AI-powered career workspace.
        </p>
      </div>

      {/* Login form */}
      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
              <FileText className="h-6 w-6" />
            </div>

            <span className="text-xl font-bold text-slate-900">
              Resume<span className="text-violet-600">AI</span>
            </span>
          </div>

          <div className="panel p-6 sm:p-8">

            <div className="mb-8">
              <div className="icon-tile mb-4 inline-flex h-11 w-11 bg-violet-600 text-white">
                <Lock className="h-5 w-5" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue to your ResumeAI workspace.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="field py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="field py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <div className="mt-7 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={() => router.push("/register")}
                className="mt-1 text-sm font-medium text-violet-600 transition hover:underline disabled:opacity-50"
              >
                Create a new account
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
