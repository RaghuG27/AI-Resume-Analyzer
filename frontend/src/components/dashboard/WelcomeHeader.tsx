import {
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface WelcomeHeaderProps {
  email: string;
}

export default function WelcomeHeader({
  email,
}: WelcomeHeaderProps) {
  const name = email.split("@")[0];

  return (
    <div className="mb-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="chip mb-3 border-slate-200 bg-slate-50 text-slate-700">
            <Sparkles size={13} />

            AI-powered career workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back,{" "}
            <span className="text-slate-900">
              {name}
            </span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Analyze your resume, compare it with job
            descriptions, and discover where you can
            improve your chances of matching a role.
          </p>
        </div>

        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Workspace active

          <ArrowUpRight size={14} />
        </div>
      </div>
    </div>
  );
}