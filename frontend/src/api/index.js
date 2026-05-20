import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const createExpense = (data) =>
  api.post('/expense/create', data)

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

export default api