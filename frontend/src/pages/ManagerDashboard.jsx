// 类似FinanceDashboard，但显示所有报销单，侧重主管视角
import { Card, Table, Tag, Button, Modal, Input, message } from 'antd'
import { useState, useEffect } from 'react'
import api from '../api'

const { TextArea } = Input

function ManagerDashboard() {
  const [expenses, setExpenses] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await api.get('/expense/list')
      // 主管看所有状态
      setExpenses(result || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleApprove = async () => {
    try {
      await api.post(`/approval/approve/${selected.id}`, { comment })
      message.success('审批通过')
      setSelected(null)
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '报销单号', dataIndex: 'expense_no' },
    { title: '金额', dataIndex: 'amount', render: v => `¥${v?.toFixed(2)}` },
    { title: '类别', dataIndex: 'category' },
    {
      title: '状态',
      dataIndex: 'status',
      render: s => <Tag>{s}</Tag>
    },
    {
      title: '操作',
      render: (_, record) => (
        record.status === 'pending_manager' && (
          <Button size="small" type="primary" onClick={() => setSelected(record)}>
            审批
          </Button>
        )
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="主管审批">
        <Table columns={columns} dataSource={expenses} rowKey="id" />
      </Card>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        title="主管审批"
      >
        {selected && (
          <>
            <p>报销单号: {selected.expense_no}</p>
            <p>金额: ¥{selected.amount?.toFixed(2)}</p>
            <TextArea placeholder="审批意见" value={comment} onChange={e => setComment(e.target.value)} />
            <Button type="primary" onClick={handleApprove} style={{ marginTop: 8 }}>通过</Button>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ManagerDashboard