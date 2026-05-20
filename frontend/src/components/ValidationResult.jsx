import { Alert, List, Tag } from 'antd'

function ValidationResult({ validation }) {
  if (!validation) return null

  const statusMap = {
    valid: { type: 'success', text: '校验通过' },
    warning: { type: 'warning', text: '存在警告' },
    invalid: { type: 'error', text: '校验未通过' }
  }

  const status = statusMap[validation.overall] || statusMap.warning

  return (
    <Alert
      type={status.type}
      message={`AI校验结果: ${status.text}`}
      description={
        <List
          size="small"
          dataSource={validation.details || []}
          renderItem={item => (
            <List.Item>
              <Tag color={item.passed ? 'green' : item.level === 'warning' ? 'orange' : 'red'}>
                {item.name}
              </Tag>
              {item.message}
            </List.Item>
          )}
        />
      }
      style={{ marginTop: 16 }}
    />
  )
}

export default ValidationResult