/* SessionCard is no longer used as a standalone card — SessionList renders
   inline table rows. This stub is kept so existing imports don't break. */
const STATUS_CFG = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'lc-badge-blue',   dot: '#60a5fa' },
  IN_PROGRESS: { label: 'In Progress', cls: 'lc-badge-medium', dot: '#ffc01e', pulse: true },
  COMPLETED:   { label: 'Completed',   cls: 'lc-badge-easy',   dot: '#00b8a3' },
  CANCELLED:   { label: 'Cancelled',   cls: 'lc-badge-hard',   dot: '#ff375f' },
}

export { STATUS_CFG }

export default function SessionCard({ title, role, level, status, candidateName }) {
  const s = STATUS_CFG[status] || { label: status, cls: 'lc-badge-blue', dot: '#60a5fa' }
  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 border-b text-sm transition-colors"
      style={{ borderColor: 'var(--lc-border)' }}
    >
      <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      <span className="flex-1 font-medium" style={{ color: 'var(--lc-text)' }}>{title}</span>
      <span style={{ color: 'var(--lc-text-3)' }}>{role}</span>
      <span
        className="px-1.5 py-0.5 rounded text-xs font-mono"
        style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)' }}
      >{level}</span>
      <span style={{ color: 'var(--lc-text-3)' }}>{candidateName}</span>
      <span className={`lc-badge ${s.cls}`}>{s.label}</span>
    </div>
  )
}
