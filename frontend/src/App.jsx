import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import ExpenseCreate from './pages/ExpenseCreate'
import ExpenseDetail from './pages/ExpenseDetail'
import AdminDashboard from './pages/AdminDashboard'
import ReportsPage from './pages/ReportsPage'
import TrashPage from './pages/TrashPage'
import PaymentPage from './pages/PaymentPage'
import ChatPage from './pages/ChatPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee', 'manager']}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/create" element={<ProtectedRoute allowedRoles={['employee', 'manager']}><ExpenseCreate /></ProtectedRoute>} />
      <Route path="/employee/trash" element={<ProtectedRoute allowedRoles={['employee', 'manager']}><TrashPage /></ProtectedRoute>} />
      <Route path="/expense/:id" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'finance', 'admin']}><ExpenseDetail /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'finance', 'manager']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><PaymentPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'finance', 'admin']}><ChatPage /></ProtectedRoute>} />
      <Route path="/chat/:expenseId" element={<ProtectedRoute allowedRoles={['employee', 'manager', 'finance', 'admin']}><ChatPage /></ProtectedRoute>} />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  )
}

export default App