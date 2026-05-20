import { Card, Descriptions, Button, message, Spin, Upload, Card as AntCard, List, Tag, Image, Space, Alert, Divider } from 'antd'
import { PlusOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api'
import StatusTimeline from '../components/StatusTimeline'
import ValidationResult from '../components/ValidationResult'

const { Dragger } = Upload

function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const result = await api.get(`/expense/${id}/detail`)
      setExpense(result.data || result)
      // 如果有发票校验结果，也加载
      if (result.data?.invoices?.some(i => i.validation_result)) {
        // 汇总显示
        const hasError = result.data.invoices.some(i => i.validation_result === 'invalid')
        const hasWarning = result.data.invoices.some(i => i.validation_result === 'warning')
        setValidationResult({
          overall: hasError ? 'invalid' : hasWarning ? 'warning' : 'valid',
          summary: result.data.invoices[0]?.validation_message || ''
        })
      }
    } catch (e) {
      try {
        const result = await api.get(`/expense/${id}`)
        setExpense({ ...result.data || result, invoices: [] })
      } catch (e2) {
        message.error('加载失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB')
      return false
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await api.post(`/invoice/upload/${id}`, formData)
      message.success('上传成功' + (result.is_mock ? '（模拟OCR识别）' : ''))
      loadData()
    } catch (e) {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const result = await api.validateExpenseInvoices(id)
      setValidationResult(result)
      if (result.overall === 'invalid') {
        message.error('校验未通过，存在不合规发票')
      } else if (result.overall === 'warning') {
        message.warning('校验通过但存在警告')
      } else {
        message.success('校验全部通过')
      }
    } catch (e) {
      message.error('校验失败')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async () => {
    // 先校验
    await handleValidate()
    if (validationResult?.overall === 'invalid') {
      return
    }

    try {
      await api.post(`/expense/submit/${id}`)
      message.success('提交成功')
      loadData()
    } catch (e) {
      message.error('提交失败')
    }
  }

  if (loading) return <Spin style={{ margin: 100 }} />

  const invoiceList = expense?.invoices || []

  // 校验结果图标
  const validationIcon = {
    valid: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    warning: <WarningOutlined style={{ color: '#faad14' }} />,
    invalid: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title={`报销单详情 - ${expense?.expense_no}`}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="报销单号">{expense?.expense_no}</Descriptions.Item>
          <Descriptions.Item label="金额">
            <strong>¥{expense?.amount?.toFixed(2)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="类别">{expense?.category}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Space>
              {validationResult && validationIcon[validationResult.overall]}
              <StatusTimeline currentStatus={expense?.status} compact />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="报销事由" span={2}>
            {expense?.description || '无'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <h4>审批流程</h4>
          <StatusTimeline currentStatus={expense?.status} />
        </div>

        <Divider />

        <Space>
          {expense?.status === 'draft' && (
            <>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={validating}
              >
                提交报销
              </Button>
              {invoiceList.length > 0 && (
                <Button
                  onClick={handleValidate}
                  loading={validating}
                >
                  AI校验发票
                </Button>
              )}
            </>
          )}
          <Button onClick={() => navigate('/employee')}>
            返回
          </Button>
        </Space>
      </Card>

      {/* 校验结果显示 */}
      {validationResult && (
        <AntCard title="AI校验结果" style={{ marginTop: 16 }}>
          <Alert
            type={validationResult.overall === 'invalid' ? 'error' : validationResult.overall === 'warning' ? 'warning' : 'success'}
            message={
              <Space>
                {validationIcon[validationResult.overall]}
                <span>{validationResult.overall === 'invalid' ? '校验未通过' : validationResult.overall === 'warning' ? '存在警告' : '校验通过'}</span>
              </Space>
            }
            description={validationResult.summary}
            showIcon
          />
          {validationResult.invoices && (
            <List
              style={{ marginTop: 16 }}
              size="small"
              dataSource={validationResult.invoices}
              renderItem={item => (
                <List.Item>
                  <Space>
                    {validationIcon[item.overall]}
                    <Tag>{item.invoice_no || '未知发票'}</Tag>
                    <span>{item.summary}</span>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </AntCard>
      )}

      {/* 发票上传区域 */}
      <AntCard title="发票管理" style={{ marginTop: 16 }}>
        <Dragger
          name="file"
          multiple={true}
          accept="image/jpeg,image/png,application/pdf"
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={uploading || expense?.status !== 'draft'}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽上传发票</p>
          <p className="ant-upload-hint">支持 JPG、PNG、PDF 格式，单个文件不超过10MB</p>
        </Dragger>

        {invoiceList.length > 0 && (
          <List
            style={{ marginTop: 16 }}
            header={<div>已上传发票 ({invoiceList.length})</div>}
            itemLayout="horizontal"
            dataSource={invoiceList}
            renderItem={item => (
              <List.Item
                actions={[
                  item.image_url && (
                    <Button size="small" onClick={() => window.open(item.image_url, '_blank')}>
                      查看原图
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={validationIcon[item.validation_result] || <CheckCircleOutlined />}
                  title={
                    <Space>
                      {item.invoice_no || '未知发票号'}
                      {item.validation_result && (
                        <Tag color={item.validation_result === 'valid' ? 'green' : item.validation_result === 'warning' ? 'orange' : 'red'}>
                          {item.validation_result === 'valid' ? '已校验' : item.validation_result === 'warning' ? '警告' : '未通过'}
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <span>销售方: {item.seller_name || '未知'}</span>
                      <span>金额: ¥{item.invoice_amount?.toFixed(2) || '0.00'}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </AntCard>
    </div>
  )
}

export default ExpenseDetail