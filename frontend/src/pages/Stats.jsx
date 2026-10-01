import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api.js'
import LinkTag, { StatusBadge } from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QrBlock from '../components/QrBlock.jsx'
import { deviceLabel, formatDateTime, formatDay, formatNumber, hostOf, referrerLabel } from '../format.js'

function Breakdown({ title, items, label, total }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="muted">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="breakdown">
          {items.map((item) => {
            const pct = total ? Math.round((item.clicks / total) * 100) : 0
            return (
              <li key={item.name}>
                <div className="breakdown-row">
                  <span>{label(item.name)}</span>
                  <span className="muted">
                    {formatNumber(item.clicks)} · {pct}%
                  </span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <span>{formatDay(label)}</span>
      <strong>{formatNumber(payload[0].value)} ครั้ง</strong>
    </div>
  )
}

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
        <div className="stat-tile">
          <span>เปิดทั้งหมด</span>
          <strong>{formatNumber(stats.totalClicks)}</strong>
        </div>
        <div className="stat-tile">
          <span>ผู้เข้าชมไม่ซ้ำ</span>
          <strong>{formatNumber(stats.uniqueVisitors)}</strong>
        </div>
        <div className="stat-tile">
          <span>14 วันล่าสุด</span>
          <strong>{formatNumber(stats.daily.reduce((sum, d) => sum + d.clicks, 0))}</strong>
        </div>
        <div className="stat-tile">
          <span>เปิดล่าสุด</span>
          <strong className="stat-small">{stats.lastClickedAt ? formatDateTime(stats.lastClickedAt) : '-'}</strong>
        </div>
      </section>

      <section className="card">
        <h2>การเปิด 14 วันล่าสุด</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-soft)' }} />
              <Bar dataKey="clicks" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
