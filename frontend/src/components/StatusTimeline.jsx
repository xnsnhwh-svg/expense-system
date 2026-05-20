import { Steps, Tag } from 'antd'

const statusSteps = [
  { status: 'draft', title: '草稿' },
  { status: 'pending_finance', title: '待财务初审' },
  { status: 'pending_manager', title: '待主管审批' },
  { status: 'approved', title: '审批通过' },
  { status: 'paid', title: '已打款' }
]

function StatusTimeline({ currentStatus, compact = false }) {
  const currentIndex = statusSteps.findIndex(s => s.status === currentStatus)
  const current = currentIndex >= 0 ? currentIndex : 0

  if (compact) {
    // 简化版本：只显示状态文字
    const step = statusSteps[current]
    const colorMap = {
      draft: 'default',
      pending_finance: 'processing',
      pending_manager: 'processing',
      approved: 'success',
      rejected: 'error',
      paid: 'success'
    }
    return <Tag color={colorMap[currentStatus]}>{step?.title}</Tag>
  }

  return (
    <Steps
      current={current}
      size="small"
      items={statusSteps.map(step => ({
        title: step.title
      }))}
    />
  )
}

export default StatusTimeline