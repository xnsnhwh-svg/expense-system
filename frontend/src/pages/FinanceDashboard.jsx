import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  CheckCircle, XCircle, DollarSign, FileText, Search,
  CheckSquare, Eye, ChevronLeft
} from 'lucide-react'
import api, { payExpense } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const result = await api.get('/expense/list')
      setExpenses((result || []).filter(e =>
        e.status !== 'draft' && e.status !== 'returned' && e.status !== 'pending_dept'
      ))
    } catch (e) {}
    setLoading(false)
  }

  const handleReview = async (record) => {
    try {
      const detail = await api.get(`/expense/${record.id}/detail`)
      setSelected({ ...record, invoices: detail.invoices })
    } catch (e) {
      setSelected(record)
    }
  }

  const handleApprove = async () => {
    try { await api.post(`/approval/approve/${selected.id}`, { comment }); setSelected(null); setComment(''); loadData() } catch (e) {}
  }

  const handleReturn = async () => {
    try { await api.post(`/approval/reject/${selected.id}`, { comment }); setSelected(null); setComment(''); loadData() } catch (e) {}
  }

  const handleBatchApprove = async () => {
    try { await api.post('/approval/batch-approve', { expense_ids: selectedIds, comment: '' }); setSelectedIds([]); loadData() } catch (e) {}
  }

  const handlePay = async (expense) => {
    try { await payExpense(expense.id, '财务已打款'); loadData() } catch (e) {}
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const pendingCount = expenses.filter(e => e.status === 'pending_finance').length
  const approvedCount = expenses.filter(e => e.status === 'approved').length

  return (
    <AppLayout title="财务审核">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass rounded-2xl p-4 shadow-glass">
          <span className="text-[11px] font-medium text-warm-400 uppercase tracking-wider">待审核</span>
          <p className="text-[26px] font-semibold text-brand-600 tracking-tight mt-1">{pendingCount}</p>
        </div>
        <div className="glass rounded-2xl p-4 shadow-glass">
          <span className="text-[11px] font-medium text-warm-400 uppercase tracking-wider">待打款</span>
          <p className="text-[26px] font-semibold text-emerald-600 tracking-tight mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* Batch action */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 glass rounded-2xl">
          <span className="text-[13px] text-warm-600 font-medium">已选 {selectedIds.length} 条</span>
          <button onClick={handleBatchApprove}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-[10px] text-[12px] font-medium transition-colors">
            批量通过
          </button>
          <button onClick={() => setSelectedIds([])}
            className="px-3 py-1.5 text-[12px] font-medium text-warm-400 hover:text-warm-600 transition-colors">
            取消选择
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-2">
            {[...Array(5)].map((_, i) => (<div key={i} className="h-10 animate-shimmer rounded-xl" />))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-10 h-10 text-warm-300 mx-auto mb-3" />
            <p className="text-[13px] text-warm-400">暂无待审核报销单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] text-warm-400 border-b border-warm-200/50">
                  <th className="w-10 px-4 py-2.5"></th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">报销单号</th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">金额</th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">类别</th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">申请人</th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">部门</th>
                  <th className="text-left px-4 py-2.5 font-medium tracking-wider uppercase">状态</th>
                  <th className="text-right px-4 py-2.5 font-medium tracking-wider uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(record => (
                  <tr key={record.id} className="border-b border-warm-200/30 hover:bg-warm-100/40 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(record.id)}
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedIds.includes(record.id)
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-warm-300 hover:border-brand-400'
                        }`}>
                        {selectedIds.includes(record.id) && <CheckCircle className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-warm-500 font-mono tracking-tight">{record.expense_no}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-warm-800">¥{record.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[13px] text-warm-600">{record.category}</td>
                    <td className="px-4 py-3 text-[13px] text-warm-600">{record.employee_name}</td>
                    <td className="px-4 py-3 text-[13px] text-warm-600">{record.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleReview(record)}
                          className="text-[12px] bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" /> 审核
                        </button>
                        {record.status === 'approved' && (
                          <button onClick={() => handlePay(record)}
                            className="text-[12px] bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> 打款
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-warm-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setComment('') }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="glass-strong rounded-2xl shadow-glass-lg w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <div className="p-5 flex items-center gap-3">
              <button onClick={() => { setSelected(null); setComment('') }} className="text-warm-400 hover:text-warm-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-[15px] font-semibold text-warm-800 tracking-tight">报销单审核</h3>
                <p className="text-[12px] text-warm-400 font-mono">{selected.expense_no}</p>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-warm-400 text-[11px]">金额</span>
                  <p className="text-lg font-semibold text-warm-800 tracking-tight">¥{selected.amount?.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-warm-400 text-[11px]">类别</span>
                  <p className="text-warm-700 font-medium">{selected.category}</p>
                </div>
                <div>
                  <span className="text-warm-400 text-[11px]">状态</span>
                  <p><StatusBadge status={selected.status} /></p>
                </div>
                <div>
                  <span className="text-warm-400 text-[11px]">申请人</span>
                  <p className="text-warm-700">{selected.employee_name} · {selected.department}</p>
                </div>
              </div>

              {selected.invoices?.map(inv => (
                <div key={inv.id} className="bg-warm-100/60 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-warm-300" />
                    <div>
                      <p className="text-[13px] font-medium text-warm-700">发票号: {inv.invoice_no || '未知'}</p>
                      <p className="text-[12px] text-warm-400">金额: ¥{inv.invoice_amount?.toFixed(2) || '0.00'} · 销售方: {inv.seller_name || '未知'}</p>
                    </div>
                  </div>
                  {inv.validation_result && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      inv.validation_result === 'valid' ? 'bg-emerald-100/80 text-emerald-600' :
                      inv.validation_result === 'warning' ? 'bg-amber-100/80 text-amber-600' : 'bg-red-100/80 text-red-600'
                    }`}>
                      AI校验: {inv.validation_result === 'valid' ? '通过' : inv.validation_result === 'warning' ? '警告' : '未通过'}
                    </span>
                  )}
                  {inv.image_url && (
                    <a href={inv.image_url} target="_blank" className="block mt-2 text-[12px] text-brand-500 hover:text-brand-600">查看发票原图</a>
                  )}
                </div>
              ))}

              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="审核意见（选填）" rows={3}
                className="w-full px-4 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[13px] text-warm-700 placeholder:text-warm-300 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all resize-none" />

              <div className="flex gap-2 pt-1">
                <button onClick={handleApprove}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> 审核通过
                </button>
                <button onClick={handleReturn}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5">
                  <XCircle className="w-4 h-4" /> 退回修改
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}
