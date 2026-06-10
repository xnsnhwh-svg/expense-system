import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Undo2, Trash2, ArchiveRestore, Trash } from 'lucide-react'
import { listTrash, restoreExpense, permanentDeleteExpense, permanentDeleteAllTrash } from '../api'
import AppLayout from '../components/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function TrashPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try { setItems(await listTrash() || []) } catch (e) {}
    finally { setLoading(false) }
  }

  const handleRestore = async (id) => {
    try { await restoreExpense(id); loadData() } catch (e) {}
  }

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('彻底删除后无法恢复，确定要继续吗？')) return
    try { await permanentDeleteExpense(id); loadData() } catch (e) {}
  }

  const handleDeleteAll = async () => {
    if (!window.confirm(`确定要彻底删除全部 ${items.length} 条记录吗？删除后无法恢复！`)) return
    try { await permanentDeleteAllTrash(); loadData() } catch (e) {}
  }

  return (
    <AppLayout title="回收站">
      <div className="mb-4">
        <button
          onClick={() => navigate('/employee')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Undo2 className="w-4 h-4" /> 返回工作台
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-slate-400" />
              已删除的报销记录
            </h2>
            <p className="text-xs text-slate-400 mt-1">回收站中的记录不会出现在主列表中，可恢复或彻底删除</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Trash className="w-3.5 h-3.5" /> 清空回收站
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 space-y-4">
            {[...Array(3)].map((_, i) => (<div key={i} className="h-12 animate-shimmer rounded-lg" />))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <ArchiveRestore className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">回收站为空</p>
            <button
              onClick={() => navigate('/employee')}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              返回工作台
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
                  <th className="text-left px-6 py-3 font-medium">原状态</th>
                  <th className="text-right px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((record, i) => (
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
                          onClick={() => handleRestore(record.id)}
                          className="text-xs text-brand-500 hover:text-brand-700 hover:bg-brand-50 font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Undo2 className="w-3 h-3" /> 恢复
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(record.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 font-medium px-2 py-1.5 rounded-lg transition-colors"
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