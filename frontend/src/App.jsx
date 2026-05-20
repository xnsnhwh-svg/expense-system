import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import LoginPage from './pages/LoginPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import ExpenseCreate from './pages/ExpenseCreate'
import ExpenseDetail from './pages/ExpenseDetail'

function App() {
  return (
    <ConfigProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/create" element={<ExpenseCreate />} />
        <Route path="/expense/:id" element={<ExpenseDetail />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App