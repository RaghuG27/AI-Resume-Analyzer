
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Activity,
  Building2,
  BriefcaseBusiness,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

import {
  getCurrentUser,
  User,
} from "@/lib/auth";

import {
  AdminMembership,
  AdminOverview,
  AdminRole,
  AdminUser,
  approveAdminMembership,
  getAdminOverview,
  getAdminUsers,
  getPendingAdminMemberships,
  rejectAdminMembership,
  setAdminUserActive,
} from "@/lib/admin";

type Tab = "overview" | "memberships" | "users";

const statCards = [
  {
    key: "users",
    label: "Total users",
    icon: Users,
  },
  {
    key: "candidates",
    label: "Candidates",
    icon: UserCheck,
  },
  {
    key: "recruiters",
    label: "Recruiters",
    icon: ShieldCheck,
  },
  {
    key: "companies",
    label: "Companies",
    icon: Building2,
  },
  {
    key: "jobs",
    label: "Jobs",
    icon: BriefcaseBusiness,
  },
  {
    key: "applications",
    label: "Applications",
    icon: Activity,
  },
] as const;

export default function AdminPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<User | null>(null);

  const [overview, setOverview] =
    useState<AdminOverview | null>(null);

  const [memberships, setMemberships] =
    useState<AdminMembership[]>([]);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [tab, setTab] = useState<Tab>("overview");

  const [role, setRole] =
    useState<AdminRole | "all">("all");

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // --------------------------------------------------
  // LOAD ADMIN DASHBOARD
  // --------------------------------------------------

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser.is_active) {
        router.replace("/login");
        return;
      }

      if (currentUser.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAdmin(currentUser);

      const [
        stats,
        pendingMemberships,
        userResponse,
      ] = await Promise.all([
        getAdminOverview(),

        getPendingAdminMemberships(),

        getAdminUsers(
          role,
          appliedSearch,
          undefined,
          0,
          100
        ),
      ]);

      setOverview(stats);
      setMemberships(pendingMemberships);
      setUsers(userResponse.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [router, role, appliedSearch]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // --------------------------------------------------
  // APPROVE / REJECT MEMBERSHIP
  // --------------------------------------------------

  async function handleMembershipAction(
    membership: AdminMembership,
    action: "approve" | "reject"
  ) {
    const message =
      action === "approve"
        ? `Approve ${membership.user_email} for ${membership.company_name}?`
        : `Reject the membership request for ${membership.company_name}?`;

    if (!window.confirm(message)) {
      return;
    }

    setActionId(membership.membership_id);
    setError("");
    setNotice("");

    try {
      if (action === "approve") {
        await approveAdminMembership(
          membership.membership_id
        );

        setNotice(
          `${membership.user_email} has been approved for ${membership.company_name}.`
        );
      } else {
        await rejectAdminMembership(
          membership.membership_id
        );

        setNotice(
          `Membership request for ${membership.company_name} was rejected.`
        );
      }

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process membership request"
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // ACTIVATE / DEACTIVATE USER
  // --------------------------------------------------

  async function handleUserStatus(account: AdminUser) {
    const nextStatus = !account.is_active;

    const message = nextStatus
      ? `Activate ${account.email}?`
      : `Deactivate ${account.email}?`;

    if (!window.confirm(message)) {
      return;
    }

    setActionId(account.id);
    setError("");
    setNotice("");

    try {
      await setAdminUserActive(
        account.id,
        nextStatus
      );

      setNotice(
        `${account.email} has been ${
          nextStatus ? "activated" : "deactivated"
        }.`
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account status"
      );
    } finally {
      setActionId(null);
    }
  }

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search.trim());
  }

  const pendingCount =
    overview?.memberships.pending ?? memberships.length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <ShieldCheck size={14} />
              Platform administration
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage platform users, recruiter access and activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="btn-ghost"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh data
          </button>
        </div>

        {/* FEEDBACK */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        {/* TABS */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200">

          {(
            ["overview", "memberships", "users"] as Tab[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize transition ${
                tab === item
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {item === "memberships"
                ? `Recruiter approvals (${pendingCount})`
                : item === "users"
                  ? "Users"
                  : "Overview"}
            </button>
          ))}
        </div>

        {loading && !overview ? (
          <PageSkeleton />
        ) : (
          <>
            {/* ====================================== */}
            {/* OVERVIEW TAB */}
            {/* ====================================== */}

            {tab === "overview" && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  {statCards.map((card) => {
                    const Icon = card.icon;

                    let value = 0;

                    switch (card.key) {
                      case "users":
                        value = overview?.users.total ?? 0;
                        break;

                      case "candidates":
                        value = overview?.users.candidates ?? 0;
                        break;

                      case "recruiters":
                        value = overview?.users.recruiters ?? 0;
                        break;

                      case "companies":
                        value = overview?.companies.total ?? 0;
                        break;

                      case "jobs":
                        value = overview?.jobs.total ?? 0;
                        break;

                      case "applications":
                        value = overview?.applications.total ?? 0;
                        break;
                    }

                    return (
                      <div key={card.key} className="panel p-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-500">
                            {card.label}
                          </span>

                          <span className="icon-tile h-10 w-10">
                            <Icon size={18} />
                          </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
                          {value}
                        </p>
                      </div>
                    );
                  })}
                </section>

                {/* Account summary */}
                <section className="grid gap-4 sm:grid-cols-2">

                  <div className="panel p-5">
                    <h2 className="font-semibold text-slate-900">
                      Account status
                    </h2>

                    <div className="mt-4 flex justify-between text-sm">
                      <span className="text-slate-500">
                        Active users
                      </span>

                      <strong className="text-emerald-700">
                        {overview?.users.active ?? 0}
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        Inactive users
                      </span>

                      <strong className="text-rose-700">
                        {overview?.users.inactive ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="panel p-5">
                    <h2 className="font-semibold text-slate-900">
                      Recruiter memberships
                    </h2>

                    <div className="mt-4 flex justify-between text-sm">
                      <span className="text-slate-500">
                        Pending
                      </span>

                      <strong className="text-amber-700">
                        {overview?.memberships.pending ?? 0}
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">
                        Active
                      </span>

                      <strong className="text-emerald-700">
                        {overview?.memberships.active ?? 0}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* Quick actions */}
                <section className="grid gap-5 lg:grid-cols-2">

                  <div className="panel p-5">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-600" size={22} />

                      <div>
                        <h2 className="font-semibold text-slate-900">
                          Recruiter access requests
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {pendingCount} company memberships waiting for approval.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTab("memberships")}
                      className="mt-5 text-sm font-semibold text-violet-700 hover:text-violet-900"
                    >
                      Review requests →
                    </button>
                  </div>

                  <div className="panel p-5">
                    <div className="flex items-center gap-3">
                      <Users className="text-violet-600" size={22} />

                      <div>
                        <h2 className="font-semibold text-slate-900">
                          User administration
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Search accounts and control platform access.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTab("users")}
                      className="mt-5 text-sm font-semibold text-violet-700 hover:text-violet-900"
                    >
                      Manage users →
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* ====================================== */}
            {/* MEMBERSHIP APPROVAL TAB */}
            {/* ====================================== */}

            {tab === "memberships" && (
              <section className="panel overflow-hidden">

                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-semibold text-slate-900">
                    Recruiter/company membership requests
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review requests before granting company job-management access.
                  </p>
                </div>

                {memberships.length === 0 ? (
                  <div className="p-10 text-center">
                    <Check
                      className="mx-auto mb-3 text-emerald-600"
                      size={30}
                    />

                    <p className="font-semibold text-slate-800">
                      No pending requests
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      New recruiter company requests will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">

                    {memberships.map((membership) => (
                      <div
                        key={membership.membership_id}
                        className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={18}
                              className="text-violet-600"
                            />

                            <h3 className="font-semibold text-slate-900">
                              {membership.company_name}
                            </h3>
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            {membership.user_email}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Role: {membership.membership_role}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Requested:{" "}
                            {membership.created_at
                              ? new Date(
                                  membership.created_at
                                ).toLocaleString()
                              : "Not available"}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">

                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() =>
                              void handleMembershipAction(
                                membership,
                                "reject"
                              )
                            }
                            className="btn-ghost text-rose-600 disabled:opacity-50"
                          >
                            {actionId === membership.membership_id ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <X size={15} />
                            )}

                            Reject
                          </button>

                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() =>
                              void handleMembershipAction(
                                membership,
                                "approve"
                              )
                            }
                            className="btn-primary disabled:opacity-50"
                          >
                            {actionId === membership.membership_id ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={15} />
                            )}

                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ====================================== */}
            {/* USER MANAGEMENT TAB */}
            {/* ====================================== */}

            {tab === "users" && (
              <section className="panel overflow-hidden">

                <div className="flex flex-col gap-4 border-b border-slate-100 p-5">

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Platform users
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Search accounts and manage their access.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-2 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />

                      <input
                        aria-label="Search users by email"
                        className="field py-2 pl-9 pr-3 text-sm"
                        placeholder="Search by email"
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                      />
                    </div>

                    <select
                      aria-label="Filter users by role"
                      className="field px-3 py-2 text-sm sm:w-44"
                      value={role}
                      onChange={(event) =>
                        setRole(
                          event.target.value as AdminRole | "all"
                        )
                      }
                    >
                      <option value="all">All roles</option>
                      <option value="candidate">Candidates</option>
                      <option value="recruiter">Recruiters</option>
                      <option value="admin">Admins</option>
                    </select>

                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      <Search size={15} />
                      Search
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Account</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Created</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">
                          Access
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {users.map((account) => (
                        <tr key={account.id}>

                          <td className="px-5 py-4 font-medium text-slate-800">
                            {account.email}
                          </td>

                          <td className="px-5 py-4 capitalize text-slate-600">
                            {account.role}
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {account.created_at
                              ? new Date(
                                  account.created_at
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                account.is_active
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {account.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              disabled={
                                actionId !== null ||
                                (
                                  account.id === admin?.id &&
                                  account.is_active
                                )
                              }
                              onClick={() =>
                                void handleUserStatus(account)
                              }
                              className="btn-ghost px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {actionId === account.id ? (
                                <>
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                  Saving...
                                </>
                              ) : account.is_active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No users found.
                  </p>
                )}

                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                  Showing up to 100 recently created accounts.
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-xs text-slate-400">
          Signed in as {admin?.email ?? "administrator"}.
          Administrative actions are enforced by backend authorization.
        </p>
      </div>
    </AppShell>
  );
}
