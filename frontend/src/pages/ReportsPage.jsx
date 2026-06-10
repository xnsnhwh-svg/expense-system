import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import api from '../api'
import AppLayout from '../components/AppLayout'

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m] = await Promise.all([
          api.get('/admin/reports/summary'),
          api.get('/admin/reports/monthly'),
        ])
        setSummary(s)
        setMonthly(m)
      } catch (e) {} finally { setLoading(false) }
    }
    load()
  }, [])

  const byCategory = summary?.by_category || []
  const byDept = summary?.by_department || []
  const monthlyData = monthly?.monthly || []

  const statCards = [
    { label: '报销总数', value: summary?.total_count || 0 },
    { label: '报销总额', value: '¥' + ((summary?.total_amount || 0).toFixed(2)) },
    { label: '已审批', value: summary?.by_status?.approved?.count || 0 },
    { label: '已打款', value: summary?.by_status?.paid?.count || 0 },
  ]

  return (
    <AppLayout title="数据分析">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">数据概览</h2>
        <a href="/api/admin/reports/export" target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Download className="w-4 h-4" /> 导出 CSV
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">按类别统计</h3>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              <th className="text-left px-4 py-2 font-medium">类别</th>
              <th className="text-left px-4 py-2 font-medium">数量</th>
              <th className="text-right px-4 py-2 font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map(row => (
              <tr key={row.category} className="border-b border-slate-50">
                <td className="px-4 py-2.5 text-sm text-slate-700">{row.category}</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{row.count}</td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">¥{row.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">按部门统计</h3>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              <th className="text-left px-4 py-2 font-medium">部门</th>
              <th className="text-left px-4 py-2 font-medium">数量</th>
              <th className="text-right px-4 py-2 font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {byDept.map(row => (
              <tr key={row.department} className="border-b border-slate-50">
                <td className="px-4 py-2.5 text-sm text-slate-700">{row.department}</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{row.count}</td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">¥{row.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">月度趋势</h3>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              <th className="text-left px-4 py-2 font-medium">月份</th>
              <th className="text-left px-4 py-2 font-medium">数量</th>
              <th className="text-right px-4 py-2 font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map(row => (
              <tr key={row.month} className="border-b border-slate-50">
                <td className="px-4 py-2.5 text-sm text-slate-700">{row.month}月</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{row.count}</td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">¥{row.amount?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}