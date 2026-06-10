import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CreditCard, ShieldCheck,
  Users, BarChart3, LogOut, Menu, X, Bell, Settings
} from 'lucide-react'
import { listNotifications, markAllNotificationsRead } from '../api'

const navItems = {
  employee: [
    { to: '/employee', icon: LayoutDashboard, label: '工作台' },
    { to: '/employee/create', icon: FileText, label: '新建报销' },
  ],
  manager: [
    { to: '/manager', icon: ShieldCheck, label: '审批工作台' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
  finance: [
    { to: '/finance', icon: CreditCard, label: '财务审核' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
  admin: [
    { to: '/admin', icon: Users, label: '管理后台' },
    { to: '/reports', icon: BarChart3, label: '数据报表' },
  ],
}

export default function AppLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const notifRef = useRef(null)
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole') || 'employee'
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const items = navItems[userRole] || navItems.employee

  useEffect(() => {
    if (userRole !== 'employee') loadNotifications()
  }, [userRole])

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
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">财务报销系统</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-medium text-brand-700">
              {user.full_name?.[0] || user.username?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || user.username}</p>
              <p className="text-xs text-slate-500">{roleLabel[userRole]}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-slate-800">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {userRole !== 'employee' && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) loadNotifications() }}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 animate-scale-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <span className="text-sm font-medium text-slate-800">通知</span>
                      {unread > 0 && (
                        <button onClick={async () => { await markAllNotificationsRead(); loadNotifications() }} className="text-xs text-brand-500 hover:text-brand-600">
                          全部已读
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">暂无通知</p>
                      ) : notifications.map(n => (
                        <div
                          key={n.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                          onClick={() => { if (n.expense_id) window.location.href = `/expense/${n.expense_id}` }}
                        >
                          <p className="text-sm text-slate-700">{n.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}