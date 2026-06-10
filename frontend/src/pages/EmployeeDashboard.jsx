import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react'
import api, { deleteExpense } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try { setExpenses(await api.get('/expense/list') || []) } catch (e) {}
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定要将这条记录移到回收站吗？可在回收站中恢复或彻底删除。')) return
    try { await deleteExpense(id); loadData() } catch (e) {}
  }

  const stats = {
    total: expenses.length,
    draft: expenses.filter(e => e.status === 'draft' || e.status === 'returned').length,
    pending: expenses.filter(e => e.status === 'pending_finance' || e.status === 'pending_manager').length,
    done: expenses.filter(e => e.status === 'approved' || e.status === 'paid').length,
  }

  const statCards = [
    { label: '全部报销', value: stats.total, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: '草稿/退回', value: stats.draft, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '审批中', value: stats.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '已完成', value: stats.done, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ]

  return (
    <AppLayout title="我的报销">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-800">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">报销记录</h2>
          <button
            onClick={() => navigate('/employee/create')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            新建报销
          </button>
          <button
            onClick={() => navigate('/employee/trash')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="回收站"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">暂无报销记录</p>
            <button
              onClick={() => navigate('/employee/create')}
              className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1"
            >
              创建第一笔报销 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium">报销单号</th>
                  <th className="text-left px-6 py-3 font-medium">金额</th>
                  <th className="text-left px-6 py-3 font-medium">类别</th>
                  <th className="text-left px-6 py-3 font-medium">状态</th>
                  <th className="text-right px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">{record.expense_no}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">¥{record.amount?.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{record.category}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={record.status} /></td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/expense/${record.id}`)}
                          className="text-xs text-slate-500 hover:text-brand-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          查看
                        </button>
                        {(record.status === 'draft' || record.status === 'returned') && (
                          <button
                            onClick={() => navigate(`/expense/${record.id}`)}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            去提交
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 font-medium px-2 py-1.5 rounded-lg transition-colors"
                          title="移到回收站"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}