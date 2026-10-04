import {
  TrendingUp,
  Target,
  ScanSearch,
  LucideIcon,
} from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  type: "overall" | "match" | "ats";
}

const config = {
  overall: {
    icon: TrendingUp,
    iconClass:
      "bg-fuchsia-500/15 text-fuchsia-300",
  },

  match: {
    icon: Target,
    iconClass:
      "bg-violet-500/15 text-violet-300",
  },

  ats: {
    icon: ScanSearch,
    iconClass:
      "bg-sky-500/15 text-sky-300",
  },
};

export default function ScoreCard({
  title,
  score,
  description,
  type,
}: ScoreCardProps) {
  const item = config[type];

  const Icon: LucideIcon = item.icon;

  return (
    <div className="panel-2 card-hover p-5">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${item.iconClass}`}
        >
          <Icon size={19} />
        </div>

        <span className="text-xs font-medium text-slate-500">
          / 100
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-400">
        {title}
      </p>

      <div className="mt-1 flex items-end gap-1">
        <span className="text-4xl font-bold tracking-tight text-white">
          {score}
        </span>

        <span className="mb-1 text-sm text-slate-500">
          /100
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}