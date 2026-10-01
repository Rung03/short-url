export function baseUrl() {
  // RENDER_EXTERNAL_URL is set automatically on Render (https://<service>.onrender.com)
  const url = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 4000}`;
  return url.replace(/\/+$/, '');
}

export function linkStatus(row) {
  if (!row.is_active) return 'inactive';
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return 'expired';
  return 'active';
}

export function toUrlDto(row) {
  return {
    id: row.id,
    originalUrl: row.original_url,
    shortCode: row.short_code,
    shortUrl: `${baseUrl()}/${row.short_code}`,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    status: linkStatus(row),
    clickCount: Number(row.click_count ?? 0),
    owner: row.owner_username ?? null,
  };
}
