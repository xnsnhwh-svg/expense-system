import { Card, Table, Button, Tag, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api'
import StatusTimeline from '../components/StatusTimeline'

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  pending_finance: { color: 'processing', text: '待财务初审' },
  pending_manager: { color: 'processing', text: '待主管审批' },
  approved: { color: 'success', text: '审批通过' },
  rejected: { color: 'error', text: '已驳回' },
  paid: { color: 'success', text: '已打款' }
}

function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await api.get('/expense/list')
      setExpenses(result.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await api.post(`/expense/submit/${id}`)
      message.success('提交成功')
      loadData()
    } catch (e) {
      message.error('提交失败')
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
      render: s => {
        const status = statusMap[s] || { color: 'default', text: s }
        return <Tag color={status.color}>{status.text}</Tag>
      }
    },
    {
      title: '流程',
      render: (_, record) => (
        <StatusTimeline currentStatus={record.status} compact />
      )
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/expense/${record.id}`)}>
            查看
          </Button>
          {record.status === 'draft' && (
            <Button size="small" type="primary" onClick={() => handleSubmit(record.id)}>
              提交
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="我的报销"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/employee/create')}>
            新建报销
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default EmployeeDashboard