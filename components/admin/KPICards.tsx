interface KPICardsProps {
  kpis: {
    users: {
      students: number;
      mentors: number;
      investors: number;
      total: number;
    };
    innovation_score_avg: number;
    startups: {
      total: number;
      by_stage: Record<string, number>;
      by_domain: Record<string, number>;
    };
    funding: {
      total: number;
      by_stage: Record<string, number>;
    };
    engagement: {
      active_matches: number;
      active_mentorships: number;
      activity_24h: number;
    };
  };
}

export default function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      label: "Total Users",
      value: kpis.users.total,
      sublabel: `${kpis.users.students} Students · ${kpis.users.mentors} Mentors · ${kpis.users.investors} Investors`,
      icon: "👥",
      color: "border-blue-500/30 bg-blue-500/5",
    },
    {
      label: "Avg Innovation Score",
      value: kpis.innovation_score_avg,
      sublabel: "Across all active students",
      icon: "⚡",
      color: "border-yellow-500/30 bg-yellow-500/5",
    },
    {
      label: "Total Startups",
      value: kpis.startups.total,
      sublabel: `${kpis.startups.by_stage.mvp ?? 0} in MVP · ${kpis.startups.by_stage.revenue ?? 0} Revenue`,
      icon: "🚀",
      color: "border-purple-500/30 bg-purple-500/5",
    },
    {
      label: "Total Funding Raised",
      value: `$${(kpis.funding.total / 1000).toFixed(0)}K`,
      sublabel: "Across all startups",
      icon: "💰",
      color: "border-green-500/30 bg-green-500/5",
    },
    {
      label: "Active Matches",
      value: kpis.engagement.active_matches,
      sublabel: `${kpis.engagement.active_mentorships} mentorships active`,
      icon: "🤝",
      color: "border-pink-500/30 bg-pink-500/5",
    },
    {
      label: "Activity (24h)",
      value: kpis.engagement.activity_24h,
      sublabel: "Platform interactions",
      icon: "📈",
      color: "border-teal-500/30 bg-teal-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.sublabel}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
