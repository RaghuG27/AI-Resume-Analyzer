
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Building2,
  BriefcaseBusiness,
  Clock,
  Plus,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

import {
  getCurrentUser,
  User,
} from "@/lib/auth";

import {
  getMyCompanies,
  CompanyMembership,
} from "@/lib/companies";

export default function RecruiterDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser.is_active) {
        router.replace("/login");
        return;
      }

      if (currentUser.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (currentUser.role !== "recruiter") {
        router.replace("/dashboard");
        return;
      }

      setUser(currentUser);

      const memberships = await getMyCompanies();
      setCompanies(memberships);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recruiter dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeCompanies = companies.filter(
    (company) => company.status === "active"
  );

  const pendingCompanies = companies.filter(
    (company) => company.status === "pending"
  );

  if (loading) {
    return (
      <AppShell><PageSkeleton /></AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">

        {/* Header */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <ShieldCheck size={14} />
              Recruiter workspace
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome, {user?.email.split("@")[0]}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your companies, job postings and recruitment activities.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="btn-ghost"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <Link
              href="/companies"
              className="btn-primary"
            >
              <Plus size={16} />
              Create company
            </Link>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">

          <SummaryCard
            title="Total companies"
            value={companies.length}
            icon={<Building2 size={21} />}
          />

          <SummaryCard
            title="Active memberships"
            value={activeCompanies.length}
            icon={<ShieldCheck size={21} />}
          />

          <SummaryCard
            title="Pending approvals"
            value={pendingCompanies.length}
            icon={<Clock size={21} />}
          />

        </section>

        {/* Pending approval notice */}
        {pendingCompanies.length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Clock
                size={21}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <h2 className="font-semibold text-amber-900">
                  Company approval pending
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Your company membership is awaiting administrator approval.
                  You can access job management after your membership becomes active.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Company workspace */}
        <section className="panel overflow-hidden">

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                Your companies
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Companies associated with your recruiter account.
              </p>
            </div>

            <Link
              href="/companies"
              className="text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              Manage companies →
            </Link>
          </div>

          {companies.length === 0 ? (
            <div className="p-10 text-center">

              <div className="icon-tile mx-auto flex h-14 w-14">
                <Building2 size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No company added yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your company to start the recruiter onboarding process.
                An administrator must approve your company membership before
                you can manage jobs.
              </p>

              <Link
                href="/companies"
                className="btn-primary mt-5"
              >
                <Plus size={16} />
                Create your company
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {companies.map((company) => (
                <div
                  key={company.company_id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">

                    <div className="icon-tile flex h-11 w-11 shrink-0">
                      <Building2 size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {company.company_name}
                      </h3>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {company.membership_role.replace("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Created:{" "}
                        {new Date(
                          company.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        company.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : company.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {company.status}
                    </span>

                    {company.status === "active" ? (
                      <Link
                        href="/companies"
                        className="btn-primary"
                      >
                        Manage workspace
                        <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Awaiting approval
                      </span>
                    )}
                  </div>
                </div>
              ))}

            </div>
          )}
        </section>

        {/* Recruitment actions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recruitment workspace
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <ActionCard
              title="Company management"
              description="Create companies and review membership approval status."
              icon={<Building2 size={22} />}
              href="/companies"
            />

            <ActionCard
              title="Recruitment applications"
              description="Review and manage applications submitted by candidates."
              icon={<BriefcaseBusiness size={22} />}
              href="/recruitment"
            />

          </div>
        </section>

      </div>
    </AppShell>
  );
}

// ------------------------------------------------------
// SUMMARY CARD
// ------------------------------------------------------

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <div className="icon-tile h-10 w-10">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

// ------------------------------------------------------
// ACTION CARD
// ------------------------------------------------------

function ActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="panel flex items-start gap-4 p-5 transition hover:border-violet-200 hover:shadow-sm"
    >
      <div className="icon-tile h-11 w-11 shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="mt-1 shrink-0 text-slate-400"
      />
    </Link>
  );
}
