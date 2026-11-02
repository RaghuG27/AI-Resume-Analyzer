
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";

import { register, RegisterRequest } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] =
    useState<RegisterRequest["role"]>("candidate");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("Password must contain at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={29} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Account created successfully
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your {role} account has been created using{" "}
            <strong>{email}</strong>.
          </p>

          {role === "recruiter" && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-800">
              <strong>Next step:</strong> Sign in and create your
              company. Your company membership requires administrator
              approval before you can manage job postings.
            </div>
          )}

          {role === "candidate" && (
            <p className="mt-4 text-sm text-slate-500">
              Sign in to upload your resume, explore jobs and analyze
              your career profile.
            </p>
          )}

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Continue to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

      {/* LEFT BRAND PANEL */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-violet-600 p-9 text-white lg:flex xl:p-12">

        <Link
          href="/login"
          className="relative z-10 flex w-fit items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <FileText size={22} />
          </div>

          <span className="text-xl font-bold tracking-tight">
            ResumeAI
          </span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Build better careers.
            <br />
            Find better talent.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-violet-100 xl:text-base">
            Join ResumeAI to discover opportunities, evaluate
            resumes and simplify the recruitment process.
          </p>

          <div className="mt-8 space-y-5">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <User size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  For candidates
                </p>

                <p className="mt-1 text-sm text-violet-100">
                  Improve your resume and discover relevant jobs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <BriefcaseBusiness size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  For recruiters
                </p>

                <p className="mt-1 text-sm text-violet-100">
                  Manage companies, publish jobs and review applications.
                </p>
              </div>
            </div>

          </div>
        </div>

        <p className="relative z-10 text-xs text-violet-200">
          Your AI-powered recruitment workspace.
        </p>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />
      </section>

      {/* RIGHT REGISTRATION PANEL */}
      <section className="flex min-h-screen items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">

        <div className="w-full max-w-[430px]">

          {/* Mobile brand */}
          <div className="mb-5 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <FileText size={20} />
            </div>

            <span className="text-lg font-bold text-slate-900">
              Resume<span className="text-violet-600">AI</span>
            </span>
          </div>

          {/* Registration card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            {/* Header */}
            <div className="mb-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <UserPlus size={20} />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose your account type and get started.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* ACCOUNT TYPE */}
              <div>
                <label className="mb-2.5 block text-sm font-medium text-slate-700">
                  I want to register as
                </label>

                <div className="grid grid-cols-2 gap-2.5">

                  {/* Candidate */}
                  <button
                    type="button"
                    onClick={() => setRole("candidate")}
                    aria-pressed={role === "candidate"}
                    className={`relative min-h-[112px] rounded-xl border p-3 text-left transition-all ${
                      role === "candidate"
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <User
                      size={19}
                      className={
                        role === "candidate"
                          ? "text-violet-600"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Candidate
                    </p>

                    <p className="mt-1 text-xs leading-4 text-slate-500">
                      Find jobs and analyze resumes.
                    </p>

                    {role === "candidate" && (
                      <CheckCircle2
                        size={16}
                        className="absolute bottom-3 right-3 text-violet-600"
                      />
                    )}
                  </button>

                  {/* Recruiter */}
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    aria-pressed={role === "recruiter"}
                    className={`relative min-h-[112px] rounded-xl border p-3 text-left transition-all ${
                      role === "recruiter"
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <BriefcaseBusiness
                      size={19}
                      className={
                        role === "recruiter"
                          ? "text-violet-600"
                          : "text-slate-400"
                      }
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Recruiter
                    </p>

                    <p className="mt-1 text-xs leading-4 text-slate-500">
                      Manage companies and hire talent.
                    </p>

                    {role === "recruiter" && (
                      <CheckCircle2
                        size={16}
                        className="absolute bottom-3 right-3 text-violet-600"
                      />
                    )}
                  </button>

                </div>

                {role === "recruiter" && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    Company access requires administrator approval.
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type="password"
                    required
                    minLength={10}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="At least 10 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create {role} account
                    <UserPlus size={16} />
                  </>
                )}
              </button>

            </form>

            {/* LOGIN LINK */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-violet-600 hover:text-violet-800"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            By creating an account, you agree to use ResumeAI responsibly.
          </p>

        </div>
      </section>
    </main>
  );
}
