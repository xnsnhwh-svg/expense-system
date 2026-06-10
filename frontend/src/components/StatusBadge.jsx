import clsx from 'clsx'

const statusConfig = {
  draft:        { label: '草稿', color: 'bg-slate-100 text-slate-600' },
  returned:     { label: '已退回', color: 'bg-amber-50 text-amber-600' },
  pending_finance: { label: '待财务初审', color: 'bg-blue-50 text-blue-600' },
  pending_manager: { label: '待主管审批', color: 'bg-purple-50 text-purple-600' },
  approved:     { label: '已通过', color: 'bg-emerald-50 text-emerald-600' },
  rejected:     { label: '已驳回', color: 'bg-red-50 text-red-600' },
  paid:         { label: '已打款', color: 'bg-cyan-50 text-cyan-600' },
}

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.color,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {config.label}
    </span>
  )
}