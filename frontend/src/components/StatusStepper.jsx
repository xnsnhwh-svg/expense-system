import clsx from 'clsx'

const steps = [
  { status: 'draft', title: '创建' },
  { status: 'pending_dept', title: '部门审批' },
  { status: 'pending_finance', title: '财务核验' },
  { status: 'pending_manager', title: '终审' },
  { status: 'approved', title: '通过' },
  { status: 'paid', title: '打款完成' },
]

const stepOrder = ['draft', 'returned', 'pending_dept', 'pending_finance', 'pending_manager', 'approved', 'paid']

function getStepIndex(status) {
  if (status === 'returned') return 0
  if (status === 'rejected') return -1
  const idx = stepOrder.indexOf(status)
  return idx >= 0 ? Math.min(steps.findIndex(s => s.status === status), steps.length - 1) : 0
}

export default function StatusStepper({ currentStatus }) {
  const currentIdx = getStepIndex(currentStatus)

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isCompleted = i < currentIdx && currentIdx >= 0
        const isCurrent = i === currentIdx
        const isRejected = currentStatus === 'rejected'

        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-300',
                isCompleted && 'bg-brand-500 text-white shadow-sm shadow-brand-500/20',
                isCurrent && !isRejected && 'bg-brand-500 text-white ring-[3px] ring-brand-100',
                isCurrent && isRejected && 'bg-red-500 text-white ring-[3px] ring-red-100',
                !isCompleted && !isCurrent && 'bg-warm-200/60 text-warm-400'
              )}>
                {isCompleted ? '✓' : i + 1}
              </div>
              <span className={clsx(
                'text-[11px] mt-1.5 font-medium whitespace-nowrap tracking-tight',
                (isCompleted || isCurrent) ? 'text-warm-700' : 'text-warm-400'
              )}>
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={clsx(
                'h-0.5 flex-1 mx-2 mt-[-1rem] transition-colors duration-300 rounded-full',
                isCompleted ? 'bg-brand-400' : 'bg-warm-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
