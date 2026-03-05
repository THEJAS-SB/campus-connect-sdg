interface InsightReportProps {
  report: string | null;
}

export default function InsightReport({ report }: InsightReportProps) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
        <p className="text-2xl">📊</p>
        <p className="mt-2 font-medium text-slate-300">
          No report generated yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          The weekly AI Growth Report is generated every 7 days. Check back
          soon.
        </p>
      </div>
    );
  }

  const paragraphs = report.split("\n").filter(Boolean);

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">AI Strategic Report</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Generated{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-purple-600/20 px-2.5 py-0.5 text-xs font-medium text-purple-300 ring-1 ring-purple-500/30">
          Llama 3.3 70B
        </span>
      </div>

      <div className="space-y-3">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm text-slate-300 leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
