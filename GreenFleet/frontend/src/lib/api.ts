import axios from 'axios'

const api = axios.create({ 
  baseURL: (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api/v1' 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url ?? ''
    const isLoginRequest = requestUrl.includes('/auth/login')

    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; name: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
}

export const vesselApi = {
  list: (is_active = true) => api.get('/vessels/', { params: { is_active } }),
  get: (id: string) => api.get(`/vessels/${id}`),
  create: (data: object) => api.post('/vessels/', data),
  update: (id: string, data: object) => api.patch(`/vessels/${id}`, data),
  deactivate: (id: string) => api.delete(`/vessels/${id}`),
}

export const predictionApi = {
  run: (data: object) => api.post('/predictions/', data),
  forVessel: (vessel_id: string, limit = 20) =>
    api.get(`/predictions/vessel/${vessel_id}`, { params: { limit } }),
}

export const voyageApi = {
  list: (vessel_id?: string) => api.get('/voyages/', { params: vessel_id ? { vessel_id } : {} }),
  create: (data: object) => api.post('/voyages/', data),
  update: (id: string, data: object) => api.patch(`/voyages/${id}`, data),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
}

export const ciiApi = {
  calculate: (data: object) => api.post('/cii/calculate', data),
  history: (vessel_id: string) => api.get(`/cii/vessel/${vessel_id}/history`),
}

export const optimizationApi = {
  runQpso: (data: object) => api.post('/optimization/qpso', data),
  benchmark: (data: object) => api.post('/optimization/benchmark', data),
}
