const dateTime = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
const number = new Intl.NumberFormat('th-TH')

export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : '-')
export const formatDay = (isoDate) => dateOnly.format(new Date(`${isoDate}T00:00:00`))
export const formatNumber = (value) => number.format(value ?? 0)

export const DEVICE_LABELS = {
  mobile: 'มือถือ',
  tablet: 'แท็บเล็ต',
  desktop: 'คอมพิวเตอร์',
  bot: 'บอท',
  unknown: 'ไม่ทราบ',
}

export const deviceLabel = (type) => DEVICE_LABELS[type ?? 'unknown'] ?? type
export const referrerLabel = (name) => (name === 'direct' ? 'เข้าตรง / สแกน QR' : name)

export function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
