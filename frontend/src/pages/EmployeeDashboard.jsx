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
    pending: expenses.filter(e => e.status === 'pending_finance' || e.status === 'pending_manager' || e.status === 'pending_dept').length,
    done: expenses.filter(e => e.status === 'approved' || e.status === 'paid').length,
  }

  const statCards = [
    { label: '全部报销', value: stats.total, icon: FileText, color: 'text-warm-600', bg: 'bg-warm-200/60' },
    { label: '草稿/退回', value: stats.draft, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100/60' },
    { label: '审批中', value: stats.pending, icon: Clock, color: 'text-brand-600', bg: 'bg-brand-100/60' },
    { label: '已完成', value: stats.done, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100/60' },
  ]

  return (
    <AppLayout title="我的报销">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-4 shadow-glass"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-warm-400 uppercase tracking-wider">{card.label}</span>
              <div className={`w-7 h-7 rounded-[8px] ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <span className="text-[26px] font-semibold text-warm-800 tracking-tight">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Expense list */}
      <div className="glass rounded-2xl shadow-glass overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-warm-700 tracking-tight">报销记录</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/employee/trash')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-warm-400 hover:text-warm-600 hover:bg-warm-200/40 rounded-[10px] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/employee/create')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-warm-800 hover:bg-warm-900 text-white rounded-[10px] text-[12px] font-medium tracking-tight transition-all active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              新建报销
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-5 pb-5 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-shimmer rounded-xl" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-warm-300 mx-auto mb-3" />
            <p className="text-[13px] text-warm-400">暂无报销记录</p>
            <button
              onClick={() => navigate('/employee/create')}
              className="mt-3 text-[13px] text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1"
            >
              创建第一笔报销 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] text-warm-400 border-b border-warm-200/50">
                  <th className="text-left px-5 py-2.5 font-medium tracking-wider uppercase">报销单号</th>
                  <th className="text-left px-5 py-2.5 font-medium tracking-wider uppercase">金额</th>
                  <th className="text-left px-5 py-2.5 font-medium tracking-wider uppercase">类别</th>
                  <th className="text-left px-5 py-2.5 font-medium tracking-wider uppercase">状态</th>
                  <th className="text-right px-5 py-2.5 font-medium tracking-wider uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-warm-200/30 hover:bg-warm-100/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-[13px] text-warm-500 font-mono tracking-tight">{record.expense_no}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-warm-800">¥{record.amount?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-[13px] text-warm-600">{record.category}</td>
                    <td className="px-5 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/expense/${record.id}`)}
                          className="text-[12px] text-warm-400 hover:text-brand-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-warm-200/40 transition-colors"
                        >
                          查看
                        </button>
                        {(record.status === 'draft' || record.status === 'returned') && (
                          <button
                            onClick={() => navigate(`/expense/${record.id}`)}
                            className="text-[12px] bg-amber-500/90 hover:bg-amber-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            去提交
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-[12px] text-warm-300 hover:text-red-500 hover:bg-red-50 font-medium px-2 py-1.5 rounded-lg transition-colors"
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
