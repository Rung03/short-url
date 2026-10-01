const STATUS_LABELS = {
  active: 'ใช้งาน',
  inactive: 'ปิดใช้งาน',
  expired: 'หมดอายุ',
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] ?? status}</span>
}

export default function LinkTag({ link }) {
  const base = link.shortUrl.slice(0, link.shortUrl.length - link.shortCode.length)
  return (
    <a className="link-tag" href={link.shortUrl} target="_blank" rel="noreferrer">
      <span className="link-tag-base">{base}</span>
      <span className="link-tag-code">{link.shortCode}</span>
    </a>
  )
}
