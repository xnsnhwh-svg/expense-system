import { Card, Table, Button, Modal, Input, message, Tag, Descriptions } from 'antd'
import { useState, useEffect } from 'react'
import api from '../api'
import StatusTimeline from '../components/StatusTimeline'

const { TextArea } = Input

function FinanceDashboard() {
  const [expenses, setExpenses] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await api.get('/expense/list')
      // 只显示待财务审核的
      const pending = (result || []).filter(e =>
        e.status === 'pending_finance' || e.status === 'pending_manager'
      )
      setExpenses(pending)
    } catch (e) {
      console.error(e)
    }
  }

  const handleApprove = async () => {
    try {
      await api.post(`/approval/approve/${selected.id}`, { comment })
      message.success('审核通过')
      setSelected(null)
      setComment('')
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleReject = async () => {
    try {
      await api.post(`/approval/reject/${selected.id}`, { comment })
      message.success('已驳回')
      setSelected(null)
      setComment('')
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '报销单号', dataIndex: 'expense_no', width: 150 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: v => `¥${v?.toFixed(2) || '0.00'}`
    },
    { title: '类别', dataIndex: 'category', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 150,
      render: s => <Tag color="processing">{s === 'pending_finance' ? '待财务初审' : '待主管审批'}</Tag>
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => setSelected(record)}>
          审核
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="财务审核">
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无待审核报销单' }}
        />
      </Card>

      <Modal
        open={!!selected}
        onCancel={() => { setSelected(null); setComment(''); }}
        footer={null}
        width={600}
        title="报销单审核"
      >
        {selected && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="报销单号">{selected.expense_no}</Descriptions.Item>
              <Descriptions.Item label="金额">
                <Tag color="blue">¥{selected.amount?.toFixed(2)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="类别">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusTimeline currentStatus={selected.status} compact />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <TextArea
                placeholder="审核意见（可选）"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" onClick={handleApprove} style={{ marginRight: 8 }}>
                审核通过
              </Button>
              <Button danger onClick={handleReject}>
                驳回
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default FinanceDashboard