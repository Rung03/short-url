import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import UrlForm from '../components/UrlForm.jsx'
import LinkTag from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QrBlock from '../components/QrBlock.jsx'
import { formatDateTime, formatNumber } from '../format.js'

export default function Home() {
  const [created, setCreated] = useState(null)
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState([])

  const load = useCallback(() => {
    api.getSummary().then(setSummary).catch(() => {})
    api.listUrls().then((links) => setRecent(links.slice(0, 5))).catch(() => {})
  }, [])

  useEffect(load, [load])

  return (
    <>
      <section className="hero">
        <h1>ย่อลิงก์ให้สั้น แชร์ง่าย</h1>
        <p>สร้าง Short URL พร้อม QR Code และดูสถิติการเปิดได้ทันที</p>
      </section>

      <UrlForm
        onCreated={(link) => {
          setCreated(link)
          load()
        }}
      />

      {created && (
        <section className="card result" aria-live="polite">
          <div className="result-main">
            <span className="eyebrow">ลิงก์สั้นของคุณ</span>
            <div className="result-link">
              <LinkTag link={created} />
              <CopyButton text={created.shortUrl} />
            </div>
            <p className="muted break">ปลายทาง: {created.originalUrl}</p>
            {created.expiresAt && <p className="muted">หมดอายุ: {formatDateTime(created.expiresAt)}</p>}
            <Link className="btn btn-ghost" to={`/stats/${created.id}`}>
              ดูสถิติ →
            </Link>
          </div>
          <QrBlock value={created.shortUrl} fileName={`qr-${created.shortCode}`} />
        </section>
      )}

      {summary && (
        <section className="stat-grid" aria-label="ภาพรวมระบบ">
          <div className="stat-tile">
            <span>ลิงก์ทั้งหมด</span>
            <strong>{formatNumber(summary.totalLinks)}</strong>
          </div>
          <div className="stat-tile">
            <span>ลิงก์ที่ใช้งานได้</span>
            <strong>{formatNumber(summary.activeLinks)}</strong>
          </div>
          <div className="stat-tile">
            <span>การเปิดทั้งหมด</span>
            <strong>{formatNumber(summary.totalClicks)}</strong>
          </div>
          <div className="stat-tile">
            <span>เปิดวันนี้</span>
            <strong>{formatNumber(summary.clicksToday)}</strong>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="card">
          <div className="section-head">
            <h2>ลิงก์ล่าสุด</h2>
            <Link to="/history">ดูทั้งหมด →</Link>
          </div>
          <ul className="recent-list">
            {recent.map((link) => (
              <li key={link.id}>
                <div className="recent-text">
                  <LinkTag link={link} />
                  <span className="muted truncate">{link.title || link.originalUrl}</span>
                </div>
                <Link className="recent-count" to={`/stats/${link.id}`}>
                  {formatNumber(link.clickCount)} ครั้ง
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
