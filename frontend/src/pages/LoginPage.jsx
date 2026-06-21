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
    { role: '员工', user: 'employee', pwd: '123456' },
    { role: '财务', user: 'finance', pwd: '123456' },
    { role: '主管', user: 'manager', pwd: '123456' },
    { role: '管理员', user: 'admin', pwd: '123456' },
  ]

  return (
    <div className="min-h-screen flex bg-warm-100">
      {/* Left: Branding */}
      <div className="hidden lg:flex w-[440px] bg-gradient-to-br from-warm-800 via-warm-900 to-warm-900 relative overflow-hidden flex-col justify-between p-10">
        {/* Ambient orbs */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand-500/10 blur-[100px]" />
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-brand-400/8 blur-[80px]" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-amber-500/5 blur-[100px]" />
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-[8px] bg-white/15 backdrop-blur flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5 text-white/90" />
              </div>
              <span className="text-white/50 text-[11px] tracking-[0.15em] uppercase font-medium">Expense System</span>
            </div>
            <h1 className="text-[32px] font-semibold text-white leading-tight tracking-tight">
              企业财务<br />智能报销
            </h1>
            <p className="text-white/40 text-[14px] mt-4 leading-relaxed max-w-[280px]">
              AI 驱动的多 Agent 报销审批平台，让财务流程更高效、更智能
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-20 space-y-3"
          >
            {[
              { label: 'AI 发票识别，自动提取关键信息' },
              { label: '智能合规校验，多规则检测' },
              { label: '多级审批流程，高效协同' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/30 text-[13px]">
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative text-white/15 text-[11px] tracking-wide">© 2025 Enterprise Expense System</p>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          {/* Glass card */}
          <div className="glass-strong rounded-[20px] shadow-glass-lg p-8">
            <div className="mb-8">
              <div className="lg:hidden flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-[7px] bg-brand-500 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-warm-700">财务报销</span>
              </div>
              <h2 className="text-[22px] font-semibold text-warm-800 tracking-tight">欢迎回来</h2>
              <p className="text-[13px] text-warm-400 mt-1">登录你的账户以继续</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="text-[13px] text-red-600 bg-red-50/80 backdrop-blur rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">用户名</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-warm-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-10 pr-4 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[14px] text-warm-800 placeholder:text-warm-300 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-warm-500 mb-1.5 tracking-tight">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-warm-300" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-10 py-2.5 bg-warm-100/60 border-0 rounded-xl text-[14px] text-warm-800 placeholder:text-warm-300 focus:ring-2 focus:ring-brand-400/30 focus:bg-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-500 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-warm-800 hover:bg-warm-900 disabled:bg-warm-300 text-white rounded-xl font-medium text-[14px] tracking-tight transition-all duration-200 active:scale-[0.98]"
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

            <div className="mt-8 pt-6 border-t border-warm-200/60">
              <p className="text-[11px] text-warm-400 mb-3 font-medium tracking-wide uppercase">测试账号</p>
              <div className="grid grid-cols-2 gap-2">
                {testAccounts.map(acc => (
                  <button
                    key={acc.user}
                    onClick={() => { setUsername(acc.user); setPassword(acc.pwd) }}
                    className="text-left p-3 rounded-xl bg-warm-100/60 hover:bg-warm-200/60 transition-all text-xs group"
                  >
                    <span className="text-warm-600 group-hover:text-warm-800 font-medium text-[12px] tracking-tight">{acc.role}</span>
                    <br />
                    <span className="text-warm-400 text-[11px]">{acc.user}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
