interface ScoreBreakdownProps {
  scores: {
    skill_score: number;
    experience_score: number;
    responsibility_score: number;
    ats_score: number;
    education_score: number;
  };
}

export default function ScoreBreakdown({
  scores,
}: ScoreBreakdownProps) {
  const items = [
    {
      label: "Skills",
      score: scores.skill_score,
      color: "bg-violet-400",
    },
    {
      label: "Experience",
      score: scores.experience_score,
      color: "bg-fuchsia-400",
    },
    {
      label: "Responsibilities",
      score:
        scores.responsibility_score,
      color: "bg-indigo-400",
    },
    {
      label: "ATS keywords",
      score: scores.ats_score,
      color: "bg-cyan-400",
    },
    {
      label: "Education",
      score: scores.education_score,
      color: "bg-emerald-400",
    },
  ];

  return (
    <div className="panel-2 p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="font-semibold text-white">
          Score breakdown
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          How your resume performed across different
          categories.
        </p>
      </div>

      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                {item.label}
              </span>

              <span className="text-sm font-bold text-white">
                {item.score}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-700`}
                style={{
                  width: `${item.score}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}