import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { message } from 'antd'
import {
  ArrowLeft, Upload, CheckCircle, AlertTriangle, XCircle,
  Edit, ShieldCheck, DollarSign, FileText, Loader, Trash2, MessageCircle
} from 'lucide-react'
import api, { updateExpense, payExpense, deleteInvoice } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'
import StatusStepper from '../components/StatusStepper'

export default function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPayment, setEditPayment] = useState('')
  const userRole = localStorage.getItem('userRole')

  useEffect(() => { loadData() }, [id])

  const loadData = async () => {
    try {
      const result = await api.get(`/expense/${id}/detail`)
      setExpense(result)
      const invs = result?.invoices || []
      if (invs.some(i => i.validation_result)) {
        const hasError = invs.some(i => i.validation_result === 'invalid')
        const hasWarning = invs.some(i => i.validation_result === 'warning')
        setValidationResult({
          overall: hasError ? 'invalid' : hasWarning ? 'warning' : 'valid',
          summary: invs[0]?.validation_message || '',
          invoices: invs
        })
      }
    } catch (e) {
      try {
        const result = await api.get(`/expense/${id}`)
        setExpense({ ...result, invoices: [] })
      } catch (e2) {}
    } finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const result = await api.post(`/invoice/upload/${id}`, fd)
      if (result.ocr_error) {
        message.warning('发票已上传，但OCR识别失败：' + result.ocr_error)
      } else {
        message.success('发票上传成功' + (result.is_mock ? '（模拟识别）' : ''))
      }
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '上传失败')
    }
    finally { setUploading(false) }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const result = await api.post(`/invoice/validate-expense/${id}`)
      setValidationResult(result)
      if (result.overall === 'valid') {
        message.success('校验全部通过')
      } else if (result.overall === 'warning') {
        message.warning('校验通过但存在警告')
      } else {
        message.error('校验未通过')
      }
      return result
    } catch (e) {
      message.error('校验失败：' + (e.response?.data?.detail || '未知错误'))
      return null
    }
    finally { setValidating(false) }
  }

  const handleSubmit = async () => {
    if (!expense?.invoices?.length) {
      message.warning('请先上传发票再提交')
      return
    }
    const result = await handleValidate()
    if (!result) {
      message.error('AI校验失败，请稍后重试')
      return
    }
    if (result.overall === 'invalid') {
      const failedChecks = result.invoices?.flatMap(inv =>
        (inv.details || []).filter(d => !d.passed && d.level === 'error')
      ) || []
      const errorList = failedChecks.map(d => d.message).join('；')
      message.error({
        content: `校验未通过：${errorList || '存在不合规项，请修改后重试'}`,
        duration: 6
      })
      return
    }
    if (result.overall === 'warning') {
      const warnChecks = result.invoices?.flatMap(inv =>
        (inv.details || []).filter(d => !d.passed && d.level === 'warning')
      ) || []
      const warnList = warnChecks.map(d => d.message).join('；')
      message.warning({
        content: `存在警告：${warnList}，仍可提交`,
        duration: 6
      })
    }
    try {
      await api.post(`/expense/submit/${id}`)
      message.success('提交成功')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '提交失败')
    }
  }

  const handleEdit = async () => {
    try {
      await updateExpense(id, {
        amount: parseFloat(editAmount),
        category: editCategory,
        description: editDesc,
        expense_date: editDate || undefined,
        payment_method: editPayment || undefined,
      })
      setShowEdit(false)
      loadData()
    } catch (e) {}
  }

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoice(invoiceId)
      message.success('发票已删除')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '删除失败')
    }
  }

  const handlePay = async () => {
    try { await payExpense(id, '打款完成'); message.success('已标记打款'); loadData() } catch (e) { message.error('打款失败') }
  }

  if (loading) {
    return (
      <AppLayout title="详情">
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  const canEdit = expense?.status === 'draft' || expense?.status === 'returned'
  const canSubmit = canEdit && (expense?.invoices || []).length > 0
  const canPay = expense?.status === 'approved' && (userRole === 'finance' || userRole === 'admin')
  const invoiceList = expense?.invoices || []

  const vResultIcon = validationResult?.overall === 'invalid' ? <XCircle className="w-5 h-5 text-red-500" />
    : validationResult?.overall === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500" />
    : validationResult?.overall === 'valid' ? <CheckCircle className="w-5 h-5 text-emerald-500" />
    : null

  return (
    <AppLayout title="报销详情">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        {/* Main card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl shadow-glass p-6 lg:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-warm-800 text-warm-500 font-mono tracking-tight">{expense?.expense_no}</h2>
                <StatusBadge status={expense?.status} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-2xl font-bold text-warm-800">¥{expense?.amount?.toFixed(2)}</span>
                <span className="text-warm-400">·</span>
                <span className="text-warm-500">{expense?.category}</span>
                {expense?.expense_date && (
                  <>
                    <span className="text-warm-400">·</span>
                    <span className="text-warm-500 text-xs">{expense.expense_date}</span>
                  </>
                )}
              </div>
              {expense?.description && (
                <p className="text-sm text-warm-500 mt-2">{expense.description}</p>
              )}
              {expense?.paid_at && (
                <p className="text-xs text-warm-400 mt-2">打款时间: {expense.paid_at}</p>
              )}
              {expense?.payment_method && (
                <p className="text-xs text-warm-400 mt-1">收款方式: {expense.payment_method}</p>
              )}
            </div>
          </div>

          {/* Status stepper */}
          <div className="py-4 border-y border-warm-200/40 mb-6">
            <StatusStepper currentStatus={expense?.status} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  setEditAmount(expense.amount)
                  setEditCategory(expense.category)
                  setEditDesc(expense.description || '')
                  setEditDate(expense.expense_date || '')
                  setEditPayment(expense.payment_method || '')
                  setShowEdit(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-warm-200/60 text-warm-600 hover:bg-warm-100/40 rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4" /> 编辑
              </button>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={validating}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl transition-all hover:shadow-glass-lg active:scale-[0.98]"
              >
                {validating ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {validating ? '校验中...' : '提交报销'}
              </button>
            )}
            {invoiceList.length > 0 && canEdit && (
              <button onClick={handleValidate} disabled={validating}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-warm-200/60 text-warm-600 hover:bg-warm-100/40 rounded-xl transition-colors"
              >
                {validating ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                AI校验发票
              </button>
            )}
            {canPay && (
              <button onClick={handlePay}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all hover:shadow-glass-lg active:scale-[0.98]"
              >
                <DollarSign className="w-4 h-4" /> 确认打款
              </button>
            )}
            <button onClick={() => navigate(`/chat?expense=${id}`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-brand-200 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> 沟通
            </button>
          </div>
        </motion.div>

        {/* Validation result */}
        {validationResult && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`rounded-xl border p-6 ${
              validationResult.overall === 'invalid' ? 'bg-red-50 border-red-100' :
              validationResult.overall === 'warning' ? 'bg-amber-50 border-amber-100' :
              'bg-emerald-50 border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {vResultIcon}
              <span className={`text-sm font-semibold ${
                validationResult.overall === 'invalid' ? 'text-red-700' :
                validationResult.overall === 'warning' ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                AI校验结果：
                {validationResult.overall === 'invalid' ? '未通过' :
                 validationResult.overall === 'warning' ? '存在警告' : '全部通过'}
              </span>
            </div>
            {validationResult.summary && (
              <p className="text-sm text-warm-600 mb-3">{validationResult.summary}</p>
            )}
            {validationResult.invoices?.map(inv => (
              <div key={inv.invoice_id} className="mt-3 pt-3 border-t border-inherit">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-warm-600">{inv.invoice_no || '未知发票'}</span>
                  <span className="text-xs text-warm-400">{inv.summary}</span>
                </div>
                {(inv.details || []).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      d.passed ? 'bg-emerald-100/60 text-emerald-700' :
                      d.level === 'warning' ? 'bg-amber-100/60 text-amber-700' : 'bg-red-100/60 text-red-700'
                    }`}>{d.name}</span>
                    <span className="text-warm-500">{d.message}</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {/* Invoice management */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl shadow-glass p-6 lg:p-8"
        >
          <h3 className="text-sm font-semibold text-warm-800 mb-4">发票管理</h3>

          {canEdit && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-warm-200/60 hover:border-brand-300 hover:bg-brand-50/40 rounded-xl p-8 text-center cursor-pointer transition-all"
            >
              {uploading ? (
                <Loader className="w-8 h-8 text-brand-400 mx-auto animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-warm-300 mx-auto mb-2" />
              )}
              <p className="text-sm text-warm-500">
                {uploading ? '上传中...' : '点击或拖拽上传发票'}
              </p>
              <p className="text-xs text-warm-400 mt-1">支持 JPG、PNG、PDF，单文件不超过10MB</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleUpload} className="hidden" />
            </div>
          )}

          {invoiceList.length > 0 && (
            <div className="mt-4 space-y-3">
              {invoiceList.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-warm-100/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-warm-300" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-warm-700">{inv.invoice_no || '未知发票号'}</span>
                        {inv.validation_result && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inv.validation_result === 'valid' ? 'bg-emerald-100/60 text-emerald-600' :
                            inv.validation_result === 'warning' ? 'bg-amber-100/60 text-amber-600' : 'bg-red-100/60 text-red-600'
                          }`}>
                            {inv.validation_result === 'valid' ? '已校验' : inv.validation_result === 'warning' ? '警告' : '未通过'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-0.5">
                        销售方: {inv.seller_name || '未知'} · 金额: ¥{inv.invoice_amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.image_url && (
                      <a href={inv.image_url} target="_blank" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                        查看原图
                      </a>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDeleteInvoice(inv.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Edit modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-warm-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl shadow-glass-lg p-6 w-full max-w-md"
            >
              <h3 className="font-semibold text-warm-800 mb-4">编辑报销单</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">金额</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">¥</span>
                    <input type="number" min="0.01" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">类别</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['差旅', '办公', '招待', '交通', '其他'].map(cat => (
                      <button key={cat} type="button" onClick={() => setEditCategory(cat)}
                        className={`py-2 px-3 rounded-xl text-sm border transition-all ${
                          editCategory === cat ? 'border-brand-500 bg-brand-50/60 text-brand-700' : 'border-warm-200/60 text-warm-600'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">事由</label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">费用日期</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none" />
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">收款方式</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['银行卡', '支付宝', '微信', '现金'].map(m => (
                      <button key={m} type="button" onClick={() => setEditPayment(m === editPayment ? '' : m)}
                        className={'py-2 px-3 rounded-xl text-xs border transition-all ' +
                          (editPayment === m ? 'border-brand-500 bg-brand-50/60 text-brand-700' : 'border-warm-200/60 text-warm-600')}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-warm-600 hover:bg-warm-100/40 rounded-xl transition-colors">取消</button>
                <button onClick={handleEdit} className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors">保存</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}