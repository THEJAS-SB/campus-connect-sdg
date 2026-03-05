interface KpiCardProps {
  label: string
  value: string | number
  icon: string
  description?: string
  color?: 'purple' | 'blue' | 'green' | 'orange'
}

const COLOR_MAP = {
  purple: 'border-purple-500/20 bg-purple-500/5',
  blue: 'border-blue-500/20 bg-blue-500/5',
  green: 'border-green-500/20 bg-green-500/5',
  orange: 'border-orange-500/20 bg-orange-500/5',
}

export default function KpiCard({ label, value, icon, description, color = 'purple' }: KpiCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${COLOR_MAP[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-white">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}
