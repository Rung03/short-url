import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import LinkTag, { StatusBadge } from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { Breakdown, DailyChart, KpiTile } from '../components/Charts.jsx'
import { deviceLabel, formatDateTime, formatNumber, hostOf, referrerLabel } from '../format.js'

function Dashboard({ summary: raw }) {
  if (!raw) return null
  // Default the lists so an older API response can't crash the page
  const summary = { daily: [], devices: [], referrers: [], topLinks: [], uniqueVisitors: 0, ...raw }
  const last14 = summary.daily.reduce((sum, d) => sum + d.clicks, 0)

  return (
    <section className="dashboard" aria-label="Dashboard">
      <div className="stat-grid stat-grid-5">
        <KpiTile label="ลิงก์ทั้งหมด" value={formatNumber(summary.totalLinks)} />
        <KpiTile label="ใช้งานได้" value={formatNumber(summary.activeLinks)} />
        <KpiTile label="เปิดทั้งหมด" value={formatNumber(summary.totalClicks)} />
        <KpiTile label="ผู้เข้าชมไม่ซ้ำ" value={formatNumber(summary.uniqueVisitors)} />
        <KpiTile label="เปิดวันนี้" value={formatNumber(summary.clicksToday)} />
      </div>

      <div className="dashboard-main">
        <section className="card">
          <div className="card-head">
            <h2>การเปิด 14 วันล่าสุด</h2>
            <span className="muted">{formatNumber(last14)} ครั้ง</span>
          </div>
          <DailyChart data={summary.daily} height={260} />
        </section>

        <section className="card">
          <h2>ลิงก์ยอดนิยม</h2>
          {summary.topLinks.length === 0 ? (
            <p className="muted">ยังไม่มีการเปิดลิงก์</p>
          ) : (
            <ol className="top-links">
              {summary.topLinks.map((link) => (
                <li key={link.id}>
                  <Link to={`/stats/${link.id}`} className="top-link">
                    <span className="top-link-code">/{link.shortCode}</span>
                    <span className="muted truncate">{link.title || hostOf(link.originalUrl)}</span>
                  </Link>
                  <strong>{formatNumber(link.clickCount)}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="two-col">
        <Breakdown title="อุปกรณ์" items={summary.devices} label={deviceLabel} total={summary.totalClicks} />
        <Breakdown title="ที่มา" items={summary.referrers} label={referrerLabel} total={summary.totalClicks} />
      </div>
    </section>
  )
}

export default function History() {
  const [search, setSearch] = useState('')
  const [links, setLinks] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const loadSummary = () => api.getSummary().then(setSummary).catch(() => {})

  useEffect(() => {
    loadSummary()
  }, [])

  // Debounce typing so each keystroke doesn't hit the API
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      api
        .listUrls(search.trim())
        .then((data) => !cancelled && (setLinks(data), setError('')))
        .catch((err) => !cancelled && setError(err.message))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const toggle = async (link) => {
    setBusyId(link.id)
    try {
      const updated = await api.setActive(link.id, !link.isActive)
      setLinks((list) => list.map((l) => (l.id === updated.id ? updated : l)))
      loadSummary()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (link) => {
    if (!confirm(`ลบลิงก์ /${link.shortCode} และสถิติทั้งหมด?\nการลบไม่สามารถย้อนกลับได้`)) return
    setBusyId(link.id)
    try {
      await api.deleteUrl(link.id)
      setLinks((list) => list.filter((l) => l.id !== link.id))
      loadSummary()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>ประวัติและรายงาน</h1>

      <Dashboard summary={summary} />

      <div className="page-head">
        <h2 className="section-title">ลิงก์ทั้งหมด</h2>
        <input
          className="input search"
          type="search"
          placeholder="ค้นหา"
          aria-label="ค้นหาลิงก์"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!links && !error && <p className="muted">กำลังโหลด…</p>}
      {links?.length === 0 && (
        <div className="card empty">
          {search ? 'ไม่พบลิงก์ที่ตรงกับคำค้นหา' : 'ยังไม่มีลิงก์'}
          {!search && <Link className="btn btn-primary" to="/">สร้างลิงก์แรก</Link>}
        </div>
      )}

      {links?.length > 0 && (
        <div className="card table-card">
          <table className="link-table">
            <thead>
              <tr>
                <th>URL ต้นฉบับ</th>
                <th>Short URL</th>
                <th className="num">เปิด</th>
                <th>สร้างเมื่อ</th>
                <th>สถานะ</th>
                <th><span className="sr-only">จัดการ</span></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td className="col-original" data-label="URL ต้นฉบับ">
                    {link.title && <strong className="truncate">{link.title}</strong>}
                    <a className="muted truncate" href={link.originalUrl} target="_blank" rel="noreferrer" title={link.originalUrl}>
                      {link.originalUrl}
                    </a>
                  </td>
                  <td data-label="Short URL">
                    <div className="inline-actions">
                      <LinkTag link={link} />
                      <CopyButton text={link.shortUrl} className="btn-sm" />
                    </div>
                  </td>
                  <td className="num" data-label="เปิด">{formatNumber(link.clickCount)}</td>
                  <td data-label="สร้างเมื่อ">{formatDateTime(link.createdAt)}</td>
                  <td data-label="สถานะ"><StatusBadge status={link.status} /></td>
                  <td className="col-actions">
                    <Link className="btn btn-sm btn-ghost" to={`/stats/${link.id}`}>สถิติ</Link>
                    <button className="btn btn-sm btn-ghost" disabled={busyId === link.id} onClick={() => toggle(link)}>
                      {link.isActive ? 'ปิด' : 'เปิด'}
                    </button>
                    <button className="btn btn-sm btn-danger" disabled={busyId === link.id} onClick={() => remove(link)}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
