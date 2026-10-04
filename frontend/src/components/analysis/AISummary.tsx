import {
  Sparkles,
  Quote,
} from "lucide-react";

interface AISummaryProps {
  summary: string;
}

export default function AISummary({
  summary,
}: AISummaryProps) {
  return (
    <div className="panel-2 relative overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/15 via-transparent to-fuchsia-500/10" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30">
            <Sparkles size={17} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              AI summary
            </h2>

            <p className="text-[11px] text-slate-500">
              Generated from your resume and target job
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Quote
            size={20}
            className="mt-1 shrink-0 text-fuchsia-400/50"
          />

          <p className="text-sm leading-7 text-slate-300">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}