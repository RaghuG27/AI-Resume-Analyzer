"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser, logout, User } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Resumes",
    href: "/resumes",
    icon: FileText,
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Analyses",
    href: "/analyses",
    icon: BarChart3,
  },
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
      .then((u) => {
        if (active) {
          setUser(u);
        }
      })
      .catch(() => {
        /* not authenticated — leave profile blank */
      });

    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleNavigation(href: string) {
    router.push(href);
    onClose();
  }

  const email = user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "U";
  const username = email ? email.split("@")[0] : "Your account";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* Sidebar — fixed, non-scrolling */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-72
          flex-col border-r border-slate-200 bg-white
          transition-transform duration-300
          lg:static lg:z-auto lg:w-64 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Profile */}
        <div className="flex h-20 items-center justify-between gap-3 border-b border-slate-200 px-5">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
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
            </div>
          </button>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          <p className="mb-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />

                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
