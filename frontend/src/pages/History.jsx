import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import LinkTag, { StatusBadge } from '../components/LinkTag.jsx'
import CopyButton from '../components/CopyButton.jsx'
import { formatDateTime, formatNumber } from '../format.js'

export default function History() {
  const [search, setSearch] = useState('')
  const [links, setLinks] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

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
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>ประวัติลิงก์</h1>
        <input
          className="input search"
          type="search"
          placeholder="ค้นหา URL, รหัส หรือชื่อลิงก์"
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
