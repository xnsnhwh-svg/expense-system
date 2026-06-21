import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const createExpense = (data) =>
  api.post('/expense/create', data)

export const updateExpense = (id, data) =>
  api.put(`/expense/update/${id}`, data)

export const listExpenses = () =>
  api.get('/expense/list')

export const getExpense = (id) =>
  api.get(`/expense/${id}`)

export const submitExpense = (id) =>
  api.post(`/expense/submit/${id}`)

export const approveExpense = (id, comment) =>
  api.post(`/approval/approve/${id}`, { comment })

export const rejectExpense = (id, comment) =>
  api.post(`/approval/reject/${id}`, { comment })

export const batchApprove = (expense_ids, comment) =>
  api.post('/approval/batch-approve', { expense_ids, comment })

export const batchReject = (expense_ids, comment) =>
  api.post('/approval/batch-reject', { expense_ids, comment })

export const payExpense = (id, comment) =>
  api.post(`/approval/pay/${id}`, { comment })

export const getExpenseDetail = (id) =>
  api.get(`/expense/${id}/detail`)

export const uploadInvoice = (expenseId, formData) =>
  api.post(`/invoice/upload/${expenseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const listInvoices = (expenseId) =>
  api.get(`/invoice/list/${expenseId}`)

export const validateInvoice = (invoiceId) =>
  api.post(`/invoice/validate/${invoiceId}`)

export const validateExpenseInvoices = (expenseId) =>
  api.post(`/invoice/validate-expense/${expenseId}`)

export const listNotifications = () =>
  api.get('/notification/list')

export const markNotificationRead = (id) =>
  api.post(`/notification/read/${id}`)

export const markAllNotificationsRead = () =>
  api.post('/notification/read-all')

export const deleteExpense = (id) =>
  api.delete('/expense/delete/' + id)

export const listTrash = () =>
  api.get('/expense/trash/list')

export const restoreExpense = (id) =>
  api.post('/expense/trash/restore/' + id)

export const permanentDeleteExpense = (id) =>
  api.delete('/expense/trash/permanent/' + id)

export const permanentDeleteAllTrash = () =>
  api.delete('/expense/trash/permanent-all')

export const deleteInvoice = (invoiceId) =>
  api.delete(`/invoice/delete/${invoiceId}`)

export const listPayments = () =>
  api.get('/payment/list')

export const getPayment = (expenseId) =>
  api.get(`/payment/${expenseId}`)

export const createPayment = (expenseId, data = {}) =>
  api.post(`/payment/create/${expenseId}`, data)

export const processPayment = (paymentId) =>
  api.post(`/payment/process/${paymentId}`)

export const completePayment = (paymentId) =>
  api.post(`/payment/complete/${paymentId}`)

export const failPayment = (paymentId, reason = '') =>
  api.post(`/payment/fail/${paymentId}`, { reason })

export const getChatMessages = (expenseId) =>
  api.get(`/chat/${expenseId}`)

export const sendChatMessage = (expenseId, content) =>
  api.post(`/chat/${expenseId}`, { content })

export const listMyChats = () =>
  api.get('/chat/list/my')

export default api