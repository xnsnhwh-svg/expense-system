import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { User, Lock, Eye, EyeOff, CreditCard } from 'lucide-react'
import { login as loginApi } from '../api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) return setError('请输入用户名和密码')
    setLoading(true)
    setError('')
    try {
      const result = await loginApi(username, password)
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('userRole', result.user.role)
      const roleMap = { admin: '/admin', finance: '/finance', manager: '/manager', employee: '/employee' }
      navigate(roleMap[result.user.role] || '/employee')
    } catch (e) {
      setError(e.response?.data?.detail || '用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  const testAccounts = [
    { role: '员工', user: 'employee', pwd: 'employee123' },
    { role: '财务', user: 'finance', pwd: 'finance123' },
    { role: '主管', user: 'manager', pwd: 'manager123' },
    { role: '管理员', user: 'admin', pwd: 'admin123' },
  ]

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left: Branding */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 text-sm tracking-wide">ENTERPRISE EXPENSE SYSTEM</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              企业财务<br />智能报销系统
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed">
              AI 驱动的多 Agent 报销审批平台<br />
              让财务流程更高效、更智能
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 space-y-3"
          >
            {[
              { icon: '📄', text: 'AI 发票识别 · 自动提取关键信息' },
              { icon: '🔍', text: '智能合规校验 · 4 项规则检测' },
              { icon: '⚡', text: '多级审批流程 · 高效编排协同' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative text-white/30 text-xs">© 2025 Enterprise Expense System v2.0</p>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">财务报销系统</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">欢迎回来</h2>
            <p className="text-slate-500 mt-1">登录你的账户以继续</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : '登录'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium">测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.map(acc => (
                <button
                  key={acc.user}
                  onClick={() => { setUsername(acc.user); setPassword(acc.pwd) }}
                  className="text-left p-2.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all text-xs group"
                >
                  <span className="text-slate-500 group-hover:text-slate-700 font-medium">{acc.role}</span>
                  <br />
                  <span className="text-slate-400 text-[11px]">{acc.user}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}