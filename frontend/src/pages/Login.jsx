import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.js'

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from || '/'
  if (user) return <Navigate to={from} replace />

  const isRegister = mode === 'register'
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isRegister && form.password !== form.confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }
    setLoading(true)
    try {
      await (isRegister ? register : login)(form.username, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => switchMode('login')}>
            Login
          </button>
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => switchMode('register')}>
            Register
          </button>
        </div>

        <label className="field">
          <span>Username</span>
          <input
            className="input"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={30}
            value={form.username}
            onChange={update('username')}
            required
          />
          {isRegister && <small>a-z, 0-9, _ . - ยาว 3-30 ตัว</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            maxLength={72}
            value={form.password}
            onChange={update('password')}
            required
          />
          {isRegister && <small>อย่างน้อย 8 ตัวอักษร</small>}
        </label>

        {isRegister && (
          <label className="field">
            <span>Confirm password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={form.confirm}
              onChange={update('confirm')}
              required
            />
          </label>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !form.username || !form.password}>
          {loading ? 'กำลังดำเนินการ…' : isRegister ? 'Register' : 'Login'}
        </button>

        {!isRegister && <p className="muted auth-note">ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบเพื่อรีเซ็ต</p>}
      </form>
    </div>
  )
}
