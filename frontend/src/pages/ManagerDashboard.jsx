import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { CheckCircle, Search, ChevronLeft } from 'lucide-react'
import api from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function ManagerDashboard() {
  const [expenses, setExpenses] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try { setExpenses(await api.get('/expense/list') || []) } catch (e) {}
    setLoading(false)
  }

  const handleApprove = async () => {
    try { await api.post('/approval/approve/' + selected.id, { comment }); setSelected(null); loadData() } catch (e) {}
  }

  const handleBatchApprove = async () => {
    try { await api.post('/approval/batch-approve', { expense_ids: selectedIds, comment: '' }); setSelectedIds([]); loadData() } catch (e) {}
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const pendingCount = expenses.filter(e => e.status === 'pending_manager').length

  return (
    <AppLayout title="主管审批">
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 inline-block min-w-[160px]">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">待审批</span>
        <p className="text-2xl font-bold text-purple-600 mt-1">{pendingCount}</p>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-brand-50 border border-brand-100 rounded-lg">
          <span className="text-sm text-brand-700 font-medium">已选 {selectedIds.length} 条</span>
          <button onClick={handleBatchApprove}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-colors">
            批量通过
          </button>
          <button onClick={() => setSelectedIds([])}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
            取消选择
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            {[...Array(5)].map((_, i) => (<div key={i} className="h-10 animate-shimmer rounded-lg" />))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">暂无待审批报销单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium">报销单号</th>
                  <th className="text-left px-4 py-3 font-medium">金额</th>
                  <th className="text-left px-4 py-3 font-medium">类别</th>
                  <th className="text-left px-4 py-3 font-medium">申请人</th>
                  <th className="text-left px-4 py-3 font-medium">部门</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-right px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(record => {
                  const isSelected = selectedIds.includes(record.id)
                  return (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {record.status === 'pending_manager' && (
                        <button onClick={() => toggleSelect(record.id)}
                          className={'w-4 h-4 rounded border-2 flex items-center justify-center transition-all ' +
                            (isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 hover:border-brand-400')}>
                          {isSelected && <CheckCircle className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{record.expense_no}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">¥{record.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {record.status === 'pending_manager' && (
                        <button onClick={() => setSelected(record)}
                          className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
                          审批
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-semibold text-slate-800">主管审批</h3>
                <p className="text-xs text-slate-400 font-mono">{selected.expense_no}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">金额</span>
                  <p className="text-lg font-bold text-slate-800">¥{selected.amount?.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">申请人</span>
                  <p className="text-slate-700">{selected.employee_name} · {selected.department}</p>
                </div>
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="审批意见（选填）" rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none resize-none" />
              <button onClick={handleApprove}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> 审批通过
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}