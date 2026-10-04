import {
  CheckCircle2,
  CircleAlert,
  XCircle,
  ChevronDown,
} from "lucide-react";

interface Requirement {
  requirement: string;
  category: string;
  importance: string;
  matched: boolean;
  evidence?: string | null;
  relevance: number;
}

interface RequirementListProps {
  requirements: Requirement[];
}

export default function RequirementList({
  requirements,
}: RequirementListProps) {
  return (
    <div className="panel-2 overflow-hidden">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <h2 className="font-semibold text-white">
          Requirement matching
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Each job requirement compared against
          evidence from your resume.
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {requirements.map(
          (item, index) => (
            <RequirementRow
              key={`${item.requirement}-${index}`}
              item={item}
            />
          )
        )}
      </div>
    </div>
  );
}

function RequirementRow({
  item,
}: {
  item: Requirement;
}) {
  const getStatus = () => {
    if (
      item.matched &&
      item.relevance >= 70
    ) {
      return {
        icon: CheckCircle2,
        iconClass:
          "bg-emerald-500/15 text-emerald-300",
        label: "Strong match",
        labelClass:
          "text-emerald-400",
      };
    }

    if (
      item.matched &&
      item.relevance > 0
    ) {
      return {
        icon: CircleAlert,
        iconClass:
          "bg-amber-500/15 text-amber-300",
        label: "Partial match",
        labelClass:
          "text-amber-400",
      };
    }

    return {
      icon: XCircle,
      iconClass:
        "bg-rose-500/15 text-rose-300",
      label: "Not matched",
      labelClass:
        "text-rose-400",
    };
  };

  const status = getStatus();

  const Icon = status.icon;

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition hover:bg-white/5 sm:p-6">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 ${status.iconClass}`}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">
              {item.requirement}
            </p>

            {item.importance ===
              "required" && (
              <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                Required
              </span>
            )}

            {item.importance ===
              "preferred" && (
              <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                Preferred
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className={`text-xs font-medium ${status.labelClass}`}
            >
              {status.label}
            </span>

            <span className="text-xs text-slate-600">
              •
            </span>

            <span className="text-xs text-slate-500">
              {item.category}
            </span>
          </div>
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-lg font-bold text-white">
            {item.relevance}
          </p>

          <p className="text-[10px] text-slate-500">
            relevance
          </p>
        </div>

        <ChevronDown
          size={17}
          className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-5 sm:px-6">
        <div className="sm:pl-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Resume evidence
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {item.evidence ||
              "No supporting evidence was found in the resume."}
          </p>
        </div>
      </div>
    </details>
  );
}