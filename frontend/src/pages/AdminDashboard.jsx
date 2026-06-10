import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Users, Tag } from 'lucide-react'
import api from '../api'
import AppLayout from '../components/AppLayout'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)

  useEffect(() => { loadUsers(); loadCategories() }, [])

  const loadUsers = async () => {
    try { setUsers(await api.get('/admin/users')) } catch (e) {}
  }

  const loadCategories = async () => {
    try { setCategories(await api.get('/admin/categories')) } catch (e) {}
  }

  const handleDeleteUser = async (id) => {
    try { await api.delete('/admin/users/' + id); loadUsers() } catch (e) {}
  }

  const roleLabel = { employee: '员工', finance: '财务', manager: '主管', admin: '管理员' }

  const tabs = [
    { key: 'users', icon: Users, label: '用户管理' },
    { key: 'categories', icon: Tag, label: '费用类别' },
  ]

  return (
    <AppLayout title="管理后台">
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ' +
              (activeTab === tab.key
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-slate-500 border border-transparent hover:bg-slate-100 hover:text-slate-700')}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">用户管理</h2>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> 新增用户
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium">用户名</th>
                  <th className="text-left px-6 py-3 font-medium">姓名</th>
                  <th className="text-left px-6 py-3 font-medium">角色</th>
                  <th className="text-left px-6 py-3 font-medium">部门</th>
                  <th className="text-left px-6 py-3 font-medium">邮箱</th>
                  <th className="text-right px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-700">{user.username}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{user.full_name}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">
                        {roleLabel[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{user.department || '-'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{user.email || '-'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setEditingUser(user); setShowUserModal(true) }}
                          className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm('确定删除?')) handleDeleteUser(user.id) }}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">费用类别</h2>
            <button onClick={() => { setEditingCat(null); setShowCatModal(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> 新增类别
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium">名称</th>
                  <th className="text-left px-6 py-3 font-medium">编码</th>
                  <th className="text-left px-6 py-3 font-medium">描述</th>
                  <th className="text-right px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-700 font-medium">{cat.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 font-mono">{cat.code || '-'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{cat.description || '-'}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => { setEditingCat(cat); setShowCatModal(true) }}
                        className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUserModal && <UserModal editingUser={editingUser} onClose={() => { setShowUserModal(false); setEditingUser(null) }} onSaved={loadUsers} />}
      {showCatModal && <CatModal editingCat={editingCat} onClose={() => { setShowCatModal(false); setEditingCat(null) }} onSaved={loadCategories} />}
    </AppLayout>
  )
}

function UserModal({ editingUser, onClose, onSaved }) {
  const [form, setForm] = useState(editingUser ? {
    username: editingUser.username, full_name: editingUser.full_name,
    role: editingUser.role, department: editingUser.department || '', email: editingUser.email || ''
  } : { username: '', full_name: '', password: '', role: 'employee', department: '', email: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingUser) {
        await api.put('/admin/users/' + editingUser.id, {
          full_name: form.full_name, role: form.role,
          department: form.department, email: form.email, username: form.username
        })
      } else {
        await api.post('/admin/users?username=' + form.username + '&full_name=' + form.full_name +
          '&password=' + form.password + '&role=' + form.role +
          '&department=' + (form.department || '') + '&email=' + (form.email || ''))
      }
      onSaved()
      onClose()
    } catch (e) {} finally { setSaving(false) }
  }

  const roles = ['employee', 'finance', 'manager', 'admin']
  const roleLabels = { employee: '员工', finance: '财务', manager: '主管', admin: '管理员' }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{editingUser ? '编辑用户' : '新增用户'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">用户名</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">姓名</label>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          {!editingUser && (
            <div>
              <label className="text-sm text-slate-600 mb-1 block">密码</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
            </div>
          )}
          <div>
            <label className="text-sm text-slate-600 mb-1 block">角色</label>
            <div className="grid grid-cols-4 gap-2">
              {roles.map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                  className={'py-2 rounded-lg text-xs font-medium border transition-all ' +
                    (form.role === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">部门</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">邮箱</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">取消</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg transition-colors">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CatModal({ editingCat, onClose, onSaved }) {
  const [form, setForm] = useState(editingCat ? {
    name: editingCat.name, code: editingCat.code || '', description: editingCat.description || ''
  } : { name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingCat) {
        await api.put('/admin/categories/' + editingCat.id, form)
      } else {
        await api.post('/admin/categories', form)
      }
      onSaved()
      onClose()
    } catch (e) {} finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{editingCat ? '编辑类别' : '新增类别'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">名称</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">编码</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">描述</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">取消</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg transition-colors">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
