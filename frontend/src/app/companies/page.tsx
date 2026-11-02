
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import { getCurrentUser } from "@/lib/auth";
import {
  createCompany,
  getMyCompanies,
  CompanyMembership,
} from "@/lib/companies";

export default function CompaniesPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyMembership[]>([]);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();

      if (!user.is_active) {
        router.replace("/login");
        return;
      }

      if (user.role !== "recruiter") {
        router.replace(
          user.role === "admin" ? "/admin" : "/dashboard"
        );
        return;
      }

      const data = await getMyCompanies();
      setCompanies(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load companies."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  async function handleCreateCompany(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError("Company name must contain at least 2 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await createCompany({
        name: name.trim(),
        website: website.trim() || null,
        description: description.trim() || null,
        location: location.trim() || null,
      });

      setName("");
      setWebsite("");
      setDescription("");
      setLocation("");
      setShowForm(false);

      setNotice(
        "Company created. Your owner membership is waiting for administrator approval."
      );

      await loadCompanies();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create company."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = companies.filter(
    (company) => company.status === "active"
  ).length;

  const pendingCount = companies.filter(
    (company) => company.status === "pending"
  ).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">

        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
              <Building2 size={17} />
              Recruiter workspace
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Companies
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage your company profiles.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadCompanies()}
              className="btn-ghost"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="btn-primary"
            >
              <Plus size={16} />
              Add company
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <Summary label="Total companies" value={companies.length} />
          <Summary label="Approved" value={activeCount} />
          <Summary label="Pending approval" value={pendingCount} />
        </section>

        {showForm && (
          <section className="panel p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-900">
              Create company
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add your organization's details. Your membership will be reviewed by an administrator.
            </p>

            <form
              onSubmit={handleCreateCompany}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Company name *
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={255}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example Technologies Pvt Ltd"
                    className="field px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Company location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Bengaluru, Karnataka, India"
                      className="field py-3 pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://example.com"
                    className="field px-3 py-3 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Company description
                  </label>
                  <textarea
                    rows={4}
                    maxLength={10000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe your company..."
                    className="field resize-y px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create company
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900">
              Your companies
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Membership status and company information.
            </p>
          </div>

          {loading ? (
            <div className="p-4"><ListSkeleton rows={3} /></div>
          ) : companies.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-800">
                No companies created
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create a company to begin recruiter onboarding.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {companies.map((company) => (
                <div
                  key={company.company_id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-tile h-11 w-11">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {company.company_name}
                      </h3>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {company.membership_role.replace("_", " ")}
                      </p>
                      {company.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} />
                          {company.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      company.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {company.status}
                    </span>

                    {company.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => router.push("/recruiter/jobs")}
                        className="btn-primary"
                      >
                        Manage jobs
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-700">
                        <Clock size={14} />
                        Awaiting approval
                      </span>
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

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
