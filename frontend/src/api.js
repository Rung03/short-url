export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ หากเพิ่งเปิดใช้งาน กรุณารอสักครู่แล้วลองใหม่')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `เกิดข้อผิดพลาด (${res.status})`)
  return data
}

export const api = {
  createUrl: (body) => request('/api/urls', { method: 'POST', body: JSON.stringify(body) }),
  listUrls: (search = '') => request(`/api/urls${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getSummary: () => request('/api/urls/summary'),
  getStats: (id) => request(`/api/urls/${id}/stats`),
  setActive: (id, isActive) => request(`/api/urls/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  deleteUrl: (id) => request(`/api/urls/${id}`, { method: 'DELETE' }),
}
