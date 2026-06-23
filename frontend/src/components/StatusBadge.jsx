import clsx from 'clsx'

const statusConfig = {
  draft:        { label: '草稿', color: 'bg-warm-200/60 text-warm-500' },
  returned:     { label: '已退回', color: 'bg-amber-100/60 text-amber-600' },
  pending_finance: { label: '待财务审核', color: 'bg-brand-100/60 text-brand-600' },
  pending_manager: { label: '待主管审批', color: 'bg-purple-100/60 text-purple-600' },
  approved:     { label: '已通过', color: 'bg-emerald-100/60 text-emerald-600' },
  rejected:     { label: '已驳回', color: 'bg-red-100/60 text-red-600' },
  paid:         { label: '已打款', color: 'bg-cyan-100/60 text-cyan-600' },
}

export default function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { label: status, color: 'bg-warm-200/60 text-warm-500' }
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight',
      config.color,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
      {config.label}
    </span>
  )
}
