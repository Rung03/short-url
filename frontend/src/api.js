export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

const TOKEN_KEY = 'short-url-token'

// Storage can be unavailable (private mode, blocked site data), so never let it throw
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore: the user just stays logged in for this tab only
  }
}

// Set by AuthProvider so an expired session logs the user out everywhere
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

async function request(path, options = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ หากเพิ่งเปิดใช้งาน กรุณารอสักครู่แล้วลองใหม่')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) onUnauthorized()
  if (!res.ok) throw new Error(data?.error || `เกิดข้อผิดพลาด (${res.status})`)
  return data
}

const query = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()
  return qs ? `?${qs}` : ''
}

const post = (body) => ({ method: 'POST', body: JSON.stringify(body) })
const patch = (body) => ({ method: 'PATCH', body: JSON.stringify(body) })

export const api = {
  register: (username, password) => request('/api/auth/register', post({ username, password })),
  login: (username, password) => request('/api/auth/login', post({ username, password })),
  me: () => request('/api/auth/me'),

  createUrl: (body) => request('/api/urls', post(body)),
  listUrls: ({ search, userId } = {}) => request(`/api/urls${query({ search, userId })}`),
  getSummary: ({ userId } = {}) => request(`/api/urls/summary${query({ userId })}`),
  getStats: (id) => request(`/api/urls/${id}/stats`),
  setActive: (id, isActive) => request(`/api/urls/${id}`, patch({ isActive })),
  deleteUrl: (id) => request(`/api/urls/${id}`, { method: 'DELETE' }),

  listUsers: () => request('/api/users'),
  setRole: (id, role) => request(`/api/users/${id}`, patch({ role })),
  resetPassword: (id, password) => request(`/api/users/${id}/password`, post({ password })),
}
