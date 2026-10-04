import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  LucideIcon,
} from "lucide-react";

interface InsightSectionProps {
  title: string;
  items: string[];
  type: "strengths" | "weaknesses" | "recommendations";
}

const config = {
  strengths: {
    icon: CheckCircle2,
    iconClass:
      "bg-emerald-500/15 text-emerald-300",
    bulletClass:
      "bg-emerald-500/20 text-emerald-300",
  },

  weaknesses: {
    icon: AlertTriangle,
    iconClass:
      "bg-amber-500/15 text-amber-300",
    bulletClass:
      "bg-amber-500/20 text-amber-300",
  },

  recommendations: {
    icon: Lightbulb,
    iconClass:
      "bg-fuchsia-500/15 text-fuchsia-300",
    bulletClass:
      "bg-fuchsia-500/20 text-fuchsia-300",
  },
};

export default function InsightSection({
  title,
  items,
  type,
}: InsightSectionProps) {
  const configItem = config[type];

  const Icon: LucideIcon =
    configItem.icon;

  return (
    <div className="panel-2 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${configItem.iconClass}`}
        >
          <Icon size={19} />
        </div>

        <h2 className="font-semibold text-white">
          {title}
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No items available.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${configItem.bulletClass}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              </span>

              <p className="text-sm leading-6 text-slate-300">
                {item}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}