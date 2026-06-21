import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { message } from 'antd'
import {
  Send, ChevronRight, FileText, User, Clock, ArrowLeft,
  MessageCircle, Search
} from 'lucide-react'
import api from '../api'
import AppLayout from '../components/AppLayout'

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const [chatList, setChatList] = useState([])
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef(null)
  const userRole = localStorage.getItem('userRole')
  const userObj = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = Number(userObj.id)

  useEffect(() => { loadChatList() }, [])
  useEffect(() => {
    const expenseId = searchParams.get('expense')
    if (expenseId) {
      handleSelectExpense({ expense_id: parseInt(expenseId) })
    }
  }, [searchParams])
  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => {
    if (selectedExpense) {
      loadMessages(selectedExpense.expense_id)
      const interval = setInterval(() => loadMessages(selectedExpense.expense_id), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedExpense])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatList = async () => {
    try {
      const result = await api.get('/chat/list/my')
      setChatList(result || [])
    } catch (e) {}
    setLoading(false)
  }

  const loadMessages = async (expenseId) => {
    try {
      const result = await api.get(`/chat/${expenseId}`)
      setMessages(result || [])
    } catch (e) {}
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedExpense) return
    try {
      const result = await api.post(`/chat/${selectedExpense.expense_id}`, { content: input.trim() })
      setMessages(prev => [...prev, result])
      setInput('')
      loadChatList()
    } catch (e) {
      message.error(e.response?.data?.detail || '发送失败')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectExpense = async (item) => {
    setSelectedExpense(item)
    // If this expense isn't in chat list yet, fetch its detail
    if (!item.expense_no) {
      try {
        const detail = await api.get(`/expense/${item.expense_id}`)
        setSelectedExpense({
          expense_id: item.expense_id,
          expense_no: detail.expense_no,
          employee_name: detail.employee_name,
          amount: detail.amount,
          status: detail.status
        })
      } catch (e) {}
    }
  }

  const handleNewChat = async () => {
    try {
      const expenses = await api.get('/expense/list')
      const filtered = (expenses || []).filter(e => {
        if (userRole === 'employee') return e.status !== 'draft'
        return true
      })
      if (filtered.length === 0) {
        message.info('暂无可用报销单')
        return
      }
      setSelectedExpense({
        expense_id: filtered[0].id,
        expense_no: filtered[0].expense_no,
        employee_name: filtered[0].employee_name,
        amount: filtered[0].amount,
        status: filtered[0].status
      })
      loadMessages(filtered[0].id)
    } catch (e) {}
  }

  const filteredChats = chatList.filter(c =>
    c.expense_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const roleBadge = (role) => {
    const map = { employee: '员工', manager: '主管', finance: '财务', admin: '管理员' }
    const colors = {
      employee: 'bg-blue-50 text-blue-600',
      manager: 'bg-purple-50 text-purple-600',
      finance: 'bg-emerald-50 text-emerald-600',
      admin: 'bg-amber-50 text-amber-600'
    }
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[role] || 'bg-warm-200/60 text-warm-500'}`}>
        {map[role] || role}
      </span>
    )
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-warm-100/40">
        {/* Left panel - chat list */}
        <div className={`${selectedExpense ? 'hidden lg:flex' : 'flex'} lg:flex flex-col w-full lg:w-80 border-r border-warm-200/60 bg-white`}>
          <div className="px-4 py-3 border-b border-warm-200/50">
            <h2 className="text-base font-semibold text-warm-800">消息</h2>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索报销单号或消息"
                className="w-full pl-9 pr-3 py-2 bg-warm-100/60 border border-warm-200/40 rounded-xl text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-400/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-warm-400">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">暂无消息</p>
                <p className="text-xs mt-1">在报销单详情页发起聊天</p>
              </div>
            ) : (
              filteredChats.map((chat, i) => (
                <motion.div
                  key={chat.expense_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelectExpense(chat)}
                  className={`px-4 py-3 cursor-pointer hover:bg-warm-100/40 transition-colors border-b border-warm-200/30 ${
                    selectedExpense?.expense_id === chat.expense_id ? 'bg-brand-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-brand-500" />
                        </div>
                        {chat.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${chat.unread > 0 ? 'font-semibold text-warm-900' : 'font-medium text-warm-800'}`}>{chat.expense_no}</p>
                        <p className="text-xs text-warm-400">{chat.last_sender}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-warm-400">{formatTime(chat.last_time)}</span>
                  </div>
                  <p className={`text-xs truncate ml-11 ${chat.unread > 0 ? 'text-warm-700 font-medium' : 'text-warm-500'}`}>{chat.last_message}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right panel - chat window */}
        <div className={`${selectedExpense ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-warm-100/40`}>
          {selectedExpense ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 bg-white border-b border-warm-200/50 flex items-center gap-3">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="lg:hidden p-1 hover:bg-warm-200/60 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-warm-500" />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warm-800">{selectedExpense.expense_no}</p>
                  <p className="text-xs text-warm-400">
                    {selectedExpense.employee_name} · ¥{selectedExpense.amount?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-warm-400">
                    <p className="text-sm">暂无消息，发送第一条消息吧</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = Number(msg.sender_id) === userId
                  const showTime = i === 0 || (
                    new Date(msg.created_at) - new Date(messages[i - 1].created_at) > 300000
                  )
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="flex justify-center mb-3">
                          <span className="text-[10px] text-warm-400 bg-warm-200/60 px-2 py-0.5 rounded">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1 ml-1">
                              <span className="text-xs font-medium text-warm-600">{msg.sender_name}</span>
                              {roleBadge(msg.sender_role)}
                            </div>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-brand-500 text-white rounded-br-md'
                              : 'bg-white text-warm-700 rounded-bl-md shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 bg-white border-t border-warm-200/60">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 bg-warm-100/60 border border-warm-200/40 rounded-xl text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-400/20 outline-none resize-none"
                    style={{ maxHeight: '120px' }}
                    onInput={e => {
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-200/60 text-white rounded-xl transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-warm-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">选择一个报销单开始聊天</p>
                <p className="text-xs mt-1">财务可针对报销单与员工沟通</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
