
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser, logout, User } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const candidateNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resumes", href: "/resumes", icon: FileText },
  { name: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { name: "Saved Jobs", href: "/saved-jobs", icon: Bookmark },
  { name: "My Applications", href: "/applications", icon: Activity },
  { name: "Analyses", href: "/analyses", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
];

const recruiterNavigation = [
  { name: "Dashboard", href: "/recruiter", icon: LayoutDashboard },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Jobs", href: "/recruiter/jobs", icon: BriefcaseBusiness },
  { name: "Recruitment", href: "/recruitment", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  function handleNavigation(href: string) {
    if (pathname !== href) {
      router.push(href);
    }
    onClose();
  }

  const navigation =
    user?.role === "recruiter"
      ? recruiterNavigation
      : user?.role === "candidate"
        ? candidateNavigation
        : user?.role === "admin"
          ? adminNavigation
          : [];

  const email = user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "U";
  const username = email ? email.split("@")[0] : "Your account";

  function isItemActive(href: string) {
    // Dashboard routes are exact matches.
    if (href === "/dashboard" || href === "/recruiter") {
      return pathname === href;
    }

    // Other sections also match their nested pages.
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-pointer bg-slate-900/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Profile */}
        <div className="flex h-20 items-center justify-between gap-3 border-b border-slate-200 px-5">
          <button
            type="button"
            onClick={() =>
              handleNavigation(
                user?.role === "recruiter"
                  ? "/recruiter"
                  : user?.role === "admin"
                    ? "/admin"
                    : "/dashboard"
              )
            }
            className="flex min-w-0 cursor-pointer items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {username}
              </p>
              <p className="truncate text-xs text-slate-500">
                {email || "Not signed in"}
              </p>
              {user && (
                <p className="text-xs capitalize text-violet-600">
                  {user.role}
                </p>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role-based navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {user?.role === "recruiter"
              ? "Recruiter workspace"
              : user?.role === "candidate"
                ? "Candidate workspace"
                : "Workspace"}
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <button
                type="button"
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    active ? "text-white" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin has no admin link in sidebar */}
        {user?.role === "admin" && (
          <div className="px-5 pb-3 text-xs text-slate-400">
            Administrator workspace
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
