import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import History from './pages/History.jsx'

// Recharts is large, so only load it when a stats page is opened
const Stats = lazy(() => import('./pages/Stats.jsx'))

function NotFound() {
  return (
    <div className="card empty">
      <p>ไม่พบหน้านี้</p>
      <Link className="btn btn-primary" to="/">กลับหน้าแรก</Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">↗</span>
            Short URL
          </Link>
          <nav className="nav">
            <NavLink to="/" end>ย่อลิงก์</NavLink>
            <NavLink to="/history">ประวัติ</NavLink>
          </nav>
        </div>
      </header>

      <main className="container main">
        <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats/:id" element={<Stats />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="container footer muted">Short URL · React + Node.js + PostgreSQL</footer>
    </div>
  )
}
