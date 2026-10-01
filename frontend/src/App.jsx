import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth-context.js'
import RequireAuth from './components/RequireAuth.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

// Recharts is large, so only load it on pages that draw charts
const History = lazy(() => import('./pages/History.jsx'))
const Stats = lazy(() => import('./pages/Stats.jsx'))
const Users = lazy(() => import('./pages/Users.jsx'))

function NotFound() {
  return (
    <div className="card empty">
      <p>ไม่พบหน้านี้</p>
      <Link className="btn btn-primary" to="/">กลับหน้าแรก</Link>
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="user-menu">
      <span className="user-name" title={user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}>
        {user.username}
        {user.role === 'admin' && <span className="badge badge-admin">admin</span>}
      </span>
      <button type="button" className="btn btn-sm btn-secondary" onClick={logout}>
        ออกจากระบบ
      </button>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">↗</span>
            Short URL
          </Link>
          {user && (
            <nav className="nav">
              <NavLink to="/" end>ย่อลิงก์</NavLink>
              <NavLink to="/history">{isAdmin ? 'รายงานทั้งระบบ' : 'ประวัติและรายงาน'}</NavLink>
              {isAdmin && <NavLink to="/users">ผู้ใช้</NavLink>}
            </nav>
          )}
          <UserMenu />
        </div>
      </header>

      <main className="container main">
        <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
            <Route path="/stats/:id" element={<RequireAuth><Stats /></RequireAuth>} />
            <Route path="/users" element={<RequireAuth admin><Users /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="container footer muted">Short URL · React + Node.js + PostgreSQL</footer>
    </div>
  )
}
