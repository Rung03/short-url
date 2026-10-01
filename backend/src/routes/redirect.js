import { Router } from 'express';
import { pool } from '../db.js';
import { detectDevice } from '../utils/device.js';
import { hashIp } from '../utils/hash.js';
import { linkStatus } from '../utils/format.js';

const router = Router();

function messagePage(title, message) {
  return `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f7f9;color:#1d2433}
  main{text-align:center;padding:24px}h1{font-size:22px;margin:0 0 8px}p{margin:0;color:#5b6475}
</style></head>
<body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}

const truncate = (value, max) => (value ? String(value).slice(0, max) : null);

// GET /:code -> record the click -> 302 to the original URL
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  res.set('Cache-Control', 'no-store');

  if (!/^[A-Za-z0-9_-]{1,20}$/.test(code)) {
    return res.status(404).type('html').send(messagePage('ไม่พบลิงก์', 'ลิงก์นี้ไม่มีอยู่ในระบบ'));
  }

  const { rows } = await pool.query(
    'SELECT id, original_url, is_active, expires_at FROM urls WHERE short_code = $1',
    [code]
  );
  const link = rows[0];
  if (!link) {
    return res.status(404).type('html').send(messagePage('ไม่พบลิงก์', 'ลิงก์นี้ไม่มีอยู่ในระบบ'));
  }

  const status = linkStatus(link);
  if (status !== 'active') {
    const message = status === 'expired' ? 'ลิงก์นี้หมดอายุแล้ว' : 'ลิงก์นี้ถูกปิดใช้งาน';
    return res.status(410).type('html').send(messagePage('ลิงก์ใช้งานไม่ได้', message));
  }

  // Statistics are secondary: a failed insert must never block the redirect.
  const userAgent = truncate(req.get('user-agent'), 500);
  try {
    await pool.query(
      `INSERT INTO clicks (url_id, ip_hash, user_agent, referrer, device_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [link.id, hashIp(req.ip), userAgent, truncate(req.get('referer'), 500), detectDevice(userAgent)]
    );
  } catch (err) {
    console.error('Failed to record click:', err.message);
  }

  res.redirect(302, link.original_url);
});

export default router;
