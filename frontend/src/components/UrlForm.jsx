import { useState } from 'react'
import { api } from '../api.js'

const EMPTY = { url: '', customCode: '', expiresAt: '' }

export default function UrlForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [showOptions, setShowOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const link = await api.createUrl({
        url: form.url,
        customCode: form.customCode || undefined,
        // datetime-local is local time; send it as an absolute ISO timestamp
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      })
      setForm(EMPTY)
      onCreated?.(link)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="url-form card" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor="url-input">URL ที่ต้องการย่อ</label>
      <div className="url-form-row">
        <input
          id="url-input"
          className="input input-lg"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="วางลิงก์ที่ต้องการย่อ เช่น https://..."
          value={form.url}
          onChange={update('url')}
          required
        />
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !form.url.trim()}>
          {loading ? 'กำลังสร้าง…' : 'สร้างลิงก์สั้น'}
        </button>
      </div>

      <button
        type="button"
        className="link-button"
        aria-expanded={showOptions}
        onClick={() => setShowOptions((v) => !v)}
      >
        {showOptions ? '− ซ่อนตัวเลือกเพิ่มเติม' : '+ ตัวเลือกเพิ่มเติม'}
      </button>

      {showOptions && (
        <div className="url-form-options">
          <label className="field">
            <span>ตั้งรหัสเอง</span>
            <input
              className="input"
              type="text"
              maxLength={20}
              pattern="[A-Za-z0-9_\-]{3,20}"
              value={form.customCode}
              onChange={update('customCode')}
            />
          </label>
          <label className="field">
            <span>วันหมดอายุ</span>
            <input className="input" type="datetime-local" value={form.expiresAt} onChange={update('expiresAt')} />
          </label>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
