"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({
  onMenuClick,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      <span className="ml-3 font-semibold text-slate-900">
        Profile
      </span>
    </header>
  );
}
