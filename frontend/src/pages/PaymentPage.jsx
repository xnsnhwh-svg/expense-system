import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { message } from 'antd'
import {
  DollarSign, CreditCard, CheckCircle, XCircle, Clock,
  Loader, ArrowRight, Building2, User, FileText, RefreshCw
} from 'lucide-react'
import api, { listPayments, createPayment, processPayment, completePayment, failPayment } from '../api'
import AppLayout from '../components/AppLayout'

const statusConfig = {
  pending:    { label: '待付款', color: 'bg-amber-50 text-amber-600', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-50 text-blue-600', icon: Loader },
  success:    { label: '已打款', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  failed:     { label: '失败',   color: 'bg-red-50 text-red-600', icon: XCircle },
}

export default function PaymentPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [failReason, setFailReason] = useState('')
  const [showFail, setShowFail] = useState(null)
  const userRole = localStorage.getItem('userRole')

  const isFinance = userRole === 'finance' || userRole === 'admin'

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const result = await listPayments()
      setPayments(result || [])
    } catch (e) {}
    setLoading(false)
  }

  const loadExpenses = async () => {
    try {
      const result = await api.get('/expense/list')
      setExpenses((result || []).filter(e => e.status === 'approved'))
    } catch (e) {}
  }

  const handleCreate = async () => {
    if (!selectedExpense) return
    try {
      await createPayment(selectedExpense.id, {
        bank_account: bankAccount,
        bank_name: bankName,
        payee_name: payeeName
      })
      message.success('付款记录已创建')
      setShowCreate(false)
      setSelectedExpense(null)
      setBankAccount('')
      setBankName('')
      setPayeeName('')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '创建失败')
    }
  }

  const handleProcess = async (id) => {
    try {
      await processPayment(id)
      message.success('已开始处理')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '操作失败')
    }
  }

  const handleComplete = async (id) => {
    try {
      await completePayment(id)
      message.success('打款完成')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '操作失败')
    }
  }

  const handleFail = async () => {
    if (!showFail) return
    try {
      await failPayment(showFail, failReason)
      message.success('已标记失败')
      setShowFail(null)
      setFailReason('')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.detail || '操作失败')
    }
  }

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const successAmount = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-xl font-bold text-warm-800">支付跟踪</h1>
            <p className="text-sm text-warm-500 mt-1">管理报销打款流程</p>
          </div>
          {isFinance && (
            <button
              onClick={() => { loadExpenses(); setShowCreate(true) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all hover:shadow-glass-lg active:scale-[0.98]"
            >
              <DollarSign className="w-4 h-4" /> 新建付款
            </button>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: '付款总数', value: payments.length, icon: CreditCard, color: 'text-warm-600', bg: 'bg-warm-100/60' },
            { label: '待处理', value: payments.filter(p => p.status === 'pending' || p.status === 'processing').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '已打款', value: payments.filter(p => p.status === 'success').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: '打款金额', value: `¥${successAmount.toFixed(2)}`, icon: DollarSign, color: 'text-brand-600', bg: 'bg-brand-50' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-xl p-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-warm-800">{stat.value}</p>
              <p className="text-xs text-warm-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Payment list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl shadow-glass overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-warm-200/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-warm-800">付款记录</h2>
            <button onClick={loadData} className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-colors">
              <RefreshCw className="w-3 h-3" /> 刷新
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-6 h-6 text-warm-300 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-warm-400">
              <CreditCard className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">暂无付款记录</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-200/30">
              {payments.map((p, i) => {
                const StatusIcon = statusConfig[p.status]?.icon || Clock
                const config = statusConfig[p.status] || statusConfig.pending
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-6 py-4 hover:bg-warm-100/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${config.color.replace('text-', 'bg-').replace('50', '100')} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-warm-800">
                              {p.expense_no || `付款 #${p.id}`}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-warm-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {p.payee_name || '-'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {p.bank_name || '-'} {p.bank_account ? `(${p.bank_account})` : ''}
                            </span>
                            {p.transaction_no && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {p.transaction_no}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-warm-800">¥{p.amount?.toFixed(2)}</span>

                        {isFinance && p.status === 'pending' && (
                          <button
                            onClick={() => handleProcess(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" /> 处理
                          </button>
                        )}
                        {isFinance && p.status === 'processing' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleComplete(p.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> 完成
                            </button>
                            <button
                              onClick={() => setShowFail(p.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> 失败
                            </button>
                          </div>
                        )}
                        {p.paid_at && (
                          <span className="text-xs text-warm-400">{new Date(p.paid_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {p.remark && p.status === 'failed' && (
                      <p className="mt-2 text-xs text-red-500 ml-14">失败原因: {p.remark}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Create payment modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-warm-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl shadow-glass-lg p-6 w-full max-w-md"
            >
              <h3 className="font-semibold text-warm-800 mb-4">新建付款</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">选择报销单</label>
                  <select
                    value={selectedExpense?.id || ''}
                    onChange={e => {
                      const exp = expenses.find(x => x.id === parseInt(e.target.value))
                      setSelectedExpense(exp)
                      if (exp) {
                        setPayeeName(exp.employee_name || '')
                      }
                    }}
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none"
                  >
                    <option value="">请选择已审批的报销单</option>
                    {expenses.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.expense_no} - {e.employee_name} - ¥{e.amount?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">收款人</label>
                  <input
                    value={payeeName}
                    onChange={e => setPayeeName(e.target.value)}
                    placeholder="收款人姓名"
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">开户银行</label>
                  <input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="如：招商银行"
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">银行卡号</label>
                  <input
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    placeholder="银行卡号"
                    className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-warm-600 hover:bg-warm-100/40 rounded-xl transition-colors">取消</button>
                <button onClick={handleCreate} disabled={!selectedExpense}
                  className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 disabled:bg-warm-200/60 disabled:text-warm-400 text-white rounded-xl transition-colors"
                >创建付款</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Fail reason modal */}
        {showFail && (
          <div className="fixed inset-0 bg-warm-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-2xl shadow-glass-lg p-6 w-full max-w-sm"
            >
              <h3 className="font-semibold text-warm-800 mb-4">标记付款失败</h3>
              <div>
                <label className="text-sm text-warm-600 mb-1 block">失败原因</label>
                <textarea
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                  placeholder="请输入失败原因"
                  rows={3}
                  className="w-full px-3 py-2 border border-warm-200/60 rounded-xl text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button onClick={() => setShowFail(null)} className="px-4 py-2 text-sm text-warm-600 hover:bg-warm-100/40 rounded-xl transition-colors">取消</button>
                <button onClick={handleFail} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">确认失败</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
