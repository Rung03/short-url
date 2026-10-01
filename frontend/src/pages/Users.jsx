import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth-context.js'
import { formatDateTime, formatNumber } from '../format.js'

function RoleBadge({ user }) {
  if (user.isPrimaryAdmin) return <span className="badge badge-admin">ผู้ดูแลหลัก</span>
  if (user.role === 'admin') return <span className="badge badge-admin">ผู้ดูแล</span>
  return <span className="badge badge-inactive">ผู้ใช้</span>
}

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api.listUsers().then(setUsers).catch((err) => setError(err.message))
  }, [])

  const run = async (target, action) => {
    setBusyId(target.id)
    try {
      await action()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleRole = (target) => {
    const next = target.role === 'admin' ? 'user' : 'admin'
    const message =
      next === 'admin'
        ? `ตั้ง ${target.username} เป็นผู้ดูแลระบบ?\nจะเห็นลิงก์และรายงานของทุกคน และจัดการผู้ใช้ได้`
        : `ถอดสิทธิ์ผู้ดูแลระบบของ ${target.username}?`
    if (!confirm(message)) return
    run(target, async () => {
      const updated = await api.setRole(target.id, next)
      setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    })
  }

  const resetPassword = (target) => {
    const password = prompt(`ตั้งรหัสผ่านใหม่ให้ ${target.username} (อย่างน้อย 8 ตัวอักษร)`)
    if (password === null) return
    run(target, async () => {
      await api.resetPassword(target.id, password)
      alert(`ตั้งรหัสผ่านใหม่ให้ ${target.username} แล้ว`)
    })
  }

  const removeUser = (target) => {
    const links = target.linkCount ? `\nลิงก์ ${target.linkCount} อันของผู้ใช้นี้และสถิติทั้งหมดจะถูกลบด้วย` : ''
    if (!confirm(`ลบผู้ใช้ ${target.username}?${links}\nการลบไม่สามารถย้อนกลับได้`)) return
    run(target, async () => {
      await api.deleteUser(target.id)
      setUsers((list) => list.filter((u) => u.id !== target.id))
    })
  }

  const term = search.trim().toLowerCase()
  const shown = users?.filter((u) => u.username.includes(term)) ?? []

  return (
    <>
      <div className="page-head">
        <h1>ผู้ใช้ทั้งหมด</h1>
        <input
          className="input search"
          type="search"
          placeholder="ค้นหา"
          aria-label="ค้นหาผู้ใช้"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!users && !error && <p className="muted">กำลังโหลด…</p>}

      {users && (
        <div className="card table-card">
          <table className="link-table">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th className="num">ลิงก์</th>
                <th className="num">การเปิด</th>
                <th>สมัครเมื่อ</th>
                <th>สิทธิ์</th>
                <th><span className="sr-only">จัดการ</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => {
                const locked = u.isPrimaryAdmin || u.id === me.id
                return (
                  <tr key={u.id}>
                    <td data-label="ผู้ใช้">
                      <strong>{u.username}</strong>
                      {u.id === me.id && <span className="muted"> (คุณ)</span>}
                    </td>
                    <td className="num" data-label="ลิงก์">{formatNumber(u.linkCount)}</td>
                    <td className="num" data-label="การเปิด">{formatNumber(u.clickCount)}</td>
                    <td data-label="สมัครเมื่อ">{formatDateTime(u.createdAt)}</td>
                    <td data-label="สิทธิ์"><RoleBadge user={u} /></td>
                    <td className="col-actions">
                      <Link className="btn btn-sm btn-ghost" to={`/history?userId=${u.id}`}>รายงาน</Link>
                      {!locked && (
                        <>
                          <button className="btn btn-sm btn-ghost" disabled={busyId === u.id} onClick={() => toggleRole(u)}>
                            {u.role === 'admin' ? 'ถอดสิทธิ์ผู้ดูแล' : 'ตั้งเป็นผู้ดูแล'}
                          </button>
                          <button className="btn btn-sm btn-ghost" disabled={busyId === u.id} onClick={() => resetPassword(u)}>
                            รีเซ็ตรหัสผ่าน
                          </button>
                          <button className="btn btn-sm btn-danger" disabled={busyId === u.id} onClick={() => removeUser(u)}>
                            ลบ
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">ไม่พบผู้ใช้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
