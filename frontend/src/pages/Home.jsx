import { useState } from 'react'
import { Link } from 'react-router-dom'
import UrlForm from '../components/UrlForm.jsx'
import LinkTag from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import QrBlock from '../components/QrBlock.jsx'
import { formatDateTime } from '../format.js'

export default function Home() {
  const [created, setCreated] = useState(null)

  return (
    <>
      <section className="hero">
        <h1>ย่อลิงก์ให้สั้น แชร์ง่าย</h1>
        <p>สร้าง Short URL พร้อม QR Code ได้ทันที</p>
      </section>

      <UrlForm onCreated={setCreated} />

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
    </>
  )
}
