import { Steps, Tag } from 'antd'

const statusSteps = [
  { status: 'draft', title: '草稿' },
  { status: 'returned', title: '已退回' },
  { status: 'pending_finance', title: '待财务初审' },
  { status: 'pending_manager', title: '待主管审批' },
  { status: 'approved', title: '审批通过' },
  { status: 'paid', title: '已打款' }
]

function StatusTimeline({ currentStatus, compact = false }) {
  const currentIndex = statusSteps.findIndex(s => s.status === currentStatus)
  const current = currentIndex >= 0 ? currentIndex : 0

  if (compact) {
    const step = statusSteps[current]
    const colorMap = {
      draft: 'default', returned: 'warning',
      pending_finance: 'processing', pending_manager: 'processing',
      approved: 'success', rejected: 'error', paid: 'blue'
    }
    return <Tag color={colorMap[currentStatus] || 'default'}>{step?.title}</Tag>
  }

  return (
    <Steps
      current={current}
      size="small"
      items={statusSteps.map((step, i) => ({ title: step.title, status: i < current ? 'finish' : i === current ? 'process' : 'wait' }))}
    />
  )
}

export default StatusTimeline