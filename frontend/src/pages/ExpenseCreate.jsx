import { Card, Form, Input, InputNumber, Button, Select, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { createExpense } from '../api'

const { TextArea } = Input

function ExpenseCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      const result = await createExpense(values)
      message.success('报销单创建成功')
      navigate(`/expense/${result.id}`)
    } catch (e) {
      message.error('创建失败')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="新建报销">
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="amount"
            label="报销金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              prefix="¥"
              style={{ width: 200 }}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="报销类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select style={{ width: 200 }}>
              <Select.Option value="差旅">差旅</Select.Option>
              <Select.Option value="办公">办公</Select.Option>
              <Select.Option value="招待">招待</Select.Option>
              <Select.Option value="交通">交通</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="报销事由">
            <TextArea rows={4} placeholder="请详细描述报销原因..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              创建报销单
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ExpenseCreate