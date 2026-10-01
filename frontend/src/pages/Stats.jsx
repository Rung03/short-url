import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import LinkTag, { StatusBadge } from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QrBlock from '../components/QrBlock.jsx'
import { Breakdown, DailyChart, KpiTile } from '../components/Charts.jsx'
import { deviceLabel, formatDateTime, formatNumber, hostOf, referrerLabel } from '../format.js'

export default function Stats() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .getStats(id)
      .then((data) => !cancelled && setStats(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="card empty">
        <p>{error}</p>
        <Link className="btn btn-secondary" to="/history">กลับไปหน้าประวัติ</Link>
      </div>
    )
  }
  if (!stats) return <p className="muted">กำลังโหลด…</p>

  const { link } = stats

  const toggle = async () => {
    setBusy(true)
    try {
      const updated = await api.setActive(link.id, !link.isActive)
      setStats((s) => ({ ...s, link: updated }))
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link className="back-link" to="/history">← ประวัติลิงก์</Link>

      <section className="card stats-head">
        <div className="stats-head-main">
          <div className="stats-title">
            <h1>{link.title || hostOf(link.originalUrl)}</h1>
            <StatusBadge status={link.status} />
          </div>
          <div className="result-link">
            <LinkTag link={link} />
            <CopyButton text={link.shortUrl} />
          </div>
          <a className="muted break" href={link.originalUrl} target="_blank" rel="noreferrer">
            {link.originalUrl}
          </a>
          <p className="muted">
            สร้างเมื่อ {formatDateTime(link.createdAt)}
            {link.expiresAt && ` · หมดอายุ ${formatDateTime(link.expiresAt)}`}
          </p>
          <div>
            <button className="btn btn-secondary" disabled={busy} onClick={toggle}>
              {link.isActive ? 'ปิดใช้งานลิงก์' : 'เปิดใช้งานลิงก์'}
            </button>
          </div>
        </div>
        <QrBlock value={link.shortUrl} fileName={`qr-${link.shortCode}`} size={150} />
      </section>

      <section className="stat-grid">
        <KpiTile label="เปิดทั้งหมด" value={formatNumber(stats.totalClicks)} />
        <KpiTile label="ผู้เข้าชมไม่ซ้ำ" value={formatNumber(stats.uniqueVisitors)} />
        <KpiTile label="14 วันล่าสุด" value={formatNumber(stats.daily.reduce((sum, d) => sum + d.clicks, 0))} />
        <KpiTile
          label="เปิดล่าสุด"
          value={<span className="stat-small">{stats.lastClickedAt ? formatDateTime(stats.lastClickedAt) : '-'}</span>}
        />
      </section>

      <section className="card">
        <h2>การเปิด 14 วันล่าสุด</h2>
        <DailyChart data={stats.daily} />
      </section>

      <div className="two-col">
        <Breakdown title="อุปกรณ์" items={stats.devices} label={deviceLabel} total={stats.totalClicks} />
        <Breakdown title="ที่มา" items={stats.referrers} label={referrerLabel} total={stats.totalClicks} />
      </div>

      <section className="card table-card">
        <h2>การเปิดล่าสุด</h2>
        {stats.recentClicks.length === 0 ? (
          <p className="muted">ยังไม่มีการเปิดลิงก์นี้</p>
        ) : (
          <table className="link-table">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>อุปกรณ์</th>
                <th>ที่มา</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentClicks.map((c) => (
                <tr key={c.id}>
                  <td data-label="เวลา">{formatDateTime(c.clickedAt)}</td>
                  <td data-label="อุปกรณ์">{deviceLabel(c.deviceType)}</td>
                  <td data-label="ที่มา" className="truncate" title={c.referrer ?? ''}>
                    {c.referrer ? hostOf(c.referrer) : referrerLabel('direct')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
