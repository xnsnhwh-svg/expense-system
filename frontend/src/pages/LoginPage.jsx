import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api'

function LoginPage() {
  const navigate = useNavigate()

  const onFinish = async (values) => {
    try {
      const result = await loginApi(values.username, values.password)
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
      message.success('登录成功')

      const role = result.user.role
      if (role === 'finance') {
        navigate('/finance')
      } else if (role === 'manager') {
        navigate('/manager')
      } else {
        navigate('/employee')
      }
    } catch (e) {
      message.error('登录失败: ' + (e.response?.data?.detail || '未知错误'))
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card title="企业财务智能报销系统" style={{ width: 400 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
          <p>测试账号：employee / employee123</p>
          <p>财务账号：finance / finance123</p>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage