import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { DollarSign, Tag, FileText, ArrowLeft, Calendar, CreditCard, User } from 'lucide-react'
import { createExpense } from '../api'
import AppLayout from '../components/AppLayout'

const categories = ['差旅', '办公', '招待', '交通', '其他']
const paymentMethods = ['银行卡', '支付宝', '微信', '现金']

export default function ExpenseCreate() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || !category) return setError('请填写金额和类别')
    setLoading(true)
    setError('')
    try {
      const result = await createExpense({
        amount: parseFloat(amount),
        category,
        description,
        expense_date: expenseDate || undefined,
        payment_method: paymentMethod || undefined,
      })
      navigate('/expense/' + result.id)
    } catch (e) {
      setError('创建失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="新建报销">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8"
        >
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{user.full_name || user.username}</p>
              <p className="text-xs text-slate-500">{user.department || '未分配部门'} · {user.role === 'employee' ? '员工' : user.role === 'manager' ? '主管' : user.role}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-800 mb-6">填写报销信息</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  报销金额
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  费用日期
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Tag className="w-4 h-4 text-slate-400" />
                报销类别
              </label>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={'py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ' +
                      (category === cat
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                收款方式
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method === paymentMethod ? '' : method)}
                    className={'py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ' +
                      (paymentMethod === method
                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50')}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                报销事由
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="请详细描述报销原因..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg font-medium text-sm transition-all hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
              >
                {loading ? '创建中...' : '创建报销单'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/employee')}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  )
}