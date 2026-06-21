import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CreditCard, ShieldCheck,
  Users, BarChart3, LogOut, Menu, X, Bell, DollarSign, MessageCircle
} from 'lucide-react'
import api, { listNotifications, markAllNotificationsRead } from '../api'

const navItems = {
  employee: [
    { to: '/employee', icon: LayoutDashboard, label: '工作台' },
    { to: '/employee/create', icon: FileText, label: '新建报销' },
    { to: '/chat', icon: MessageCircle, label: '消息' },
  ],
  manager: [
    { to: '/manager', icon: ShieldCheck, label: '审批工作台' },
    { to: '/chat', icon: MessageCircle, label: '消息' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
  finance: [
    { to: '/finance', icon: CreditCard, label: '财务审核' },
    { to: '/payments', icon: DollarSign, label: '支付跟踪' },
    { to: '/chat', icon: MessageCircle, label: '消息' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
  admin: [
    { to: '/admin', icon: Users, label: '管理后台' },
    { to: '/payments', icon: DollarSign, label: '支付跟踪' },
    { to: '/chat', icon: MessageCircle, label: '消息' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
}

export default function AppLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [chatUnread, setChatUnread] = useState(0)
  const notifRef = useRef(null)
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole') || 'employee'
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const items = navItems[userRole] || navItems.employee

  useEffect(() => {
    if (userRole !== 'employee') loadNotifications()
    loadChatUnread()
    const interval = setInterval(loadChatUnread, 10000)
    return () => clearInterval(interval)
  }, [userRole])

  const loadChatUnread = async () => {
    try {
      const result = await api.get('/chat/unread/count')
      setChatUnread(result?.count || 0)
    } catch (e) {}
  }

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifications = async () => {
    try {
      const r = await listNotifications()
      setNotifications((r.items || []).slice(0, 5))
      setUnread(r.unread_count || 0)
    } catch (e) {}
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const roleLabel = { employee: '员工', manager: '主管', finance: '财务', admin: '管理员' }

  return (
    <div className="flex h-screen bg-warm-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-warm-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — glass */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 glass-strong flex flex-col
        transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5">
          <div className="w-7 h-7 rounded-[7px] bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/20">
            <CreditCard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-[13px] text-warm-800 tracking-tight">财务报销</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-warm-200/80 text-warm-800'
                    : 'text-warm-500 hover:bg-warm-200/40 hover:text-warm-700'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] opacity-80" />
              <span className="tracking-tight">{item.label}</span>
              {item.label === '消息' && chatUnread > 0 && (
                <span className="ml-auto bg-brand-500 text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {chatUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-warm-200/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-[11px] font-semibold text-white shadow-sm">
              {user.full_name?.[0] || user.username?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-warm-700 truncate tracking-tight">{user.full_name || user.username}</p>
              <p className="text-[11px] text-warm-400">{roleLabel[userRole]}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-200/60 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — glass */}
        <header className="h-14 glass flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-warm-500 hover:bg-warm-200/50 transition-colors">
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <h1 className="text-[14px] font-semibold text-warm-700 tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-1">
            {userRole !== 'employee' && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications() }}
                  className="relative p-2 rounded-[10px] text-warm-400 hover:text-warm-600 hover:bg-warm-200/50 transition-colors"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white/80" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl shadow-glass-lg z-50 animate-scale-in overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] font-semibold text-warm-700">通知</span>
                      {unread > 0 && (
                        <button onClick={async () => { await markAllNotificationsRead(); loadNotifications() }} className="text-[12px] text-brand-500 hover:text-brand-600 font-medium">
                          全部已读
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[13px] text-warm-400 text-center py-8">暂无通知</p>
                      ) : notifications.map(n => (
                        <div
                          key={n.id}
                          className="px-4 py-3 hover:bg-warm-100/60 cursor-pointer transition-colors"
                          onClick={() => { if (n.expense_id) window.location.href = `/expense/${n.expense_id}` }}
                        >
                          <p className="text-[13px] text-warm-700 font-medium">{n.title}</p>
                          <p className="text-[12px] text-warm-400 mt-0.5 truncate">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
