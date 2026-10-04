import {
  FileText,
  BriefcaseBusiness,
  BarChart3,
  Target,
  LucideIcon,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  type: "resume" | "job" | "analysis" | "score";
}

const config = {
  resume: {
    icon: FileText,
    iconClass:
      "bg-slate-50 text-slate-700",
  },

  job: {
    icon: BriefcaseBusiness,
    iconClass:
      "bg-slate-50 text-slate-700",
  },

  analysis: {
    icon: BarChart3,
    iconClass:
      "bg-violet-600 text-white",
  },

  score: {
    icon: Target,
    iconClass:
      "bg-emerald-50 text-emerald-600",
  },
};

export default function StatCard({
  title,
  value,
  description,
  type,
}: StatCardProps) {
  const item = config[type];

  const Icon: LucideIcon = item.icon;

  return (
    <div className="panel-2 card-hover group p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 ${item.iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}