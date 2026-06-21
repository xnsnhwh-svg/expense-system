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
          className="flex items-center gap-1.5 text-[13px] text-warm-400 hover:text-warm-600 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl shadow-glass p-6 lg:p-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-warm-200/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-warm-800 tracking-tight">{user.full_name || user.username}</p>
              <p className="text-[12px] text-warm-400">{user.department || '未分配部门'}</p>
            </div>
          </div>

          <h2 className="text-[16px] font-semibold text-warm-800 mb-5 tracking-tight">填写报销信息</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-[13px] text-red-600 bg-red-50/80 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">
                  <DollarSign className="w-3.5 h-3.5 text-warm-300" />
                  报销金额
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 font-medium text-[14px]">¥</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[14px] text-warm-800 placeholder:text-warm-300 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">
                  <Calendar className="w-3.5 h-3.5 text-warm-300" />
                  费用日期
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[14px] text-warm-800 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">
                <Tag className="w-3.5 h-3.5 text-warm-300" />
                报销类别
              </label>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={'py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ' +
                      (category === cat
                        ? 'bg-warm-800 text-white shadow-sm'
                        : 'bg-warm-100/60 text-warm-500 hover:bg-warm-200/60 hover:text-warm-700')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">
                <CreditCard className="w-3.5 h-3.5 text-warm-300" />
                收款方式
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method === paymentMethod ? '' : method)}
                    className={'py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all ' +
                      (paymentMethod === method
                        ? 'bg-warm-800 text-white shadow-sm'
                        : 'bg-warm-100/60 text-warm-500 hover:bg-warm-200/60 hover:text-warm-700')}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">
                <FileText className="w-3.5 h-3.5 text-warm-300" />
                报销事由
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="请详细描述报销原因..."
                className="w-full px-4 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[14px] text-warm-800 placeholder:text-warm-300 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-warm-800 hover:bg-warm-900 disabled:bg-warm-300 text-white rounded-xl font-medium text-[14px] tracking-tight transition-all active:scale-[0.98]"
              >
                {loading ? '创建中...' : '创建报销单'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/employee')}
                className="px-6 py-2.5 bg-warm-100/60 text-warm-500 hover:bg-warm-200/60 hover:text-warm-700 rounded-xl font-medium text-[14px] transition-colors"
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
