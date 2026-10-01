import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { pool } from '../db.js';
import { normalizeUrl, validateCustomCode, ValidationError } from '../utils/url.js';
import { baseUrl, toUrlDto } from '../utils/format.js';

const router = Router();
const generateCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);
const TIMEZONE = process.env.STATS_TIMEZONE || 'Asia/Bangkok';
const UNIQUE_VIOLATION = '23505';

const URL_COLUMNS = `u.id, u.original_url, u.short_code, u.title, u.is_active, u.expires_at, u.created_at`;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('id ไม่ถูกต้อง');
  return id;
}

function parseExpiresAt(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError('วันหมดอายุไม่ถูกต้อง');
  if (date <= new Date()) throw new ValidationError('วันหมดอายุต้องเป็นเวลาในอนาคต');
  return date;
}

function parseTitle(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new ValidationError('ชื่อลิงก์ไม่ถูกต้อง');
  const title = value.trim();
  if (title.length > 255) throw new ValidationError('ชื่อลิงก์ยาวเกิน 255 ตัวอักษร');
  return title || null;
}

// POST /api/urls
router.post('/', async (req, res) => {
  const { url, title, customCode, expiresAt } = req.body ?? {};
  const originalUrl = normalizeUrl(url, baseUrl());
  const values = [originalUrl, parseTitle(title), parseExpiresAt(expiresAt)];
  const insert = `INSERT INTO urls (original_url, title, expires_at, short_code)
                  VALUES ($1, $2, $3, $4)
                  RETURNING id, original_url, short_code, title, is_active, expires_at, created_at`;

  if (customCode) {
    const code = validateCustomCode(String(customCode).trim());
    try {
      const { rows } = await pool.query(insert, [...values, code]);
      return res.status(201).json(toUrlDto(rows[0]));
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        return res.status(409).json({ error: 'รหัสนี้ถูกใช้แล้ว กรุณาเลือกรหัสอื่น' });
      }
      throw err;
    }
  }

  // Random code: the UNIQUE constraint rejects a collision, so just retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { rows } = await pool.query(insert, [...values, generateCode()]);
      return res.status(201).json(toUrlDto(rows[0]));
    } catch (err) {
      if (err.code !== UNIQUE_VIOLATION) throw err;
    }
  }
  throw new Error('Could not generate a unique short code');
});

// GET /api/urls?search=
router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const params = [];
  let where = '';
  if (search) {
    params.push(`%${search}%`);
    where = 'WHERE u.original_url ILIKE $1 OR u.short_code ILIKE $1 OR u.title ILIKE $1';
  }

  const { rows } = await pool.query(
    `SELECT ${URL_COLUMNS}, COUNT(c.id) AS click_count
       FROM urls u
       LEFT JOIN clicks c ON c.url_id = u.id
       ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT 500`,
    params
  );
  res.json(rows.map(toUrlDto));
});

const REFERRER_HOST = `COALESCE(regexp_replace(substring(referrer from '^[A-Za-z][A-Za-z0-9+.-]*://([^/:?#]+)'), '^www\\.', ''), 'direct')`;
const toCount = (rows) => rows.map((r) => ({ name: r.name, clicks: Number(r.clicks) }));

// GET /api/urls/summary  (dashboard across all links)
router.get('/summary', async (req, res) => {
  const [totals, daily, devices, referrers, topLinks] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM urls) AS total_links,
         (SELECT COUNT(*) FROM urls WHERE is_active AND (expires_at IS NULL OR expires_at > now())) AS active_links,
         (SELECT COUNT(*) FROM clicks) AS total_clicks,
         (SELECT COUNT(DISTINCT ip_hash) FROM clicks) AS unique_visitors,
         (SELECT COUNT(*) FROM clicks
           WHERE (clicked_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date) AS clicks_today`,
      [TIMEZONE]
    ),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date, COUNT(c.id) AS clicks
         FROM generate_series((now() AT TIME ZONE $1)::date - 13, (now() AT TIME ZONE $1)::date, interval '1 day') AS d
         LEFT JOIN clicks c ON (c.clicked_at AT TIME ZONE $1)::date = d::date
        GROUP BY d ORDER BY d`,
      [TIMEZONE]
    ),
    pool.query(`SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*) AS clicks FROM clicks GROUP BY 1 ORDER BY 2 DESC`),
    pool.query(`SELECT ${REFERRER_HOST} AS name, COUNT(*) AS clicks FROM clicks GROUP BY 1 ORDER BY 2 DESC LIMIT 6`),
    pool.query(
      `SELECT ${URL_COLUMNS}, COUNT(c.id) AS click_count
         FROM urls u JOIN clicks c ON c.url_id = u.id
        GROUP BY u.id ORDER BY click_count DESC, u.id DESC LIMIT 5`
    ),
  ]);

  const r = totals.rows[0];
  res.json({
    totalLinks: Number(r.total_links),
    activeLinks: Number(r.active_links),
    totalClicks: Number(r.total_clicks),
    uniqueVisitors: Number(r.unique_visitors),
    clicksToday: Number(r.clicks_today),
    daily: daily.rows.map((d) => ({ date: d.date, clicks: Number(d.clicks) })),
    devices: toCount(devices.rows),
    referrers: toCount(referrers.rows),
    topLinks: topLinks.rows.map(toUrlDto),
  });
});

// GET /api/urls/:id/stats
router.get('/:id/stats', async (req, res) => {
  const id = parseId(req.params.id);
  const link = await pool.query(`SELECT ${URL_COLUMNS} FROM urls u WHERE u.id = $1`, [id]);
  if (!link.rows.length) return res.status(404).json({ error: 'ไม่พบลิงก์' });

  const [totals, daily, devices, referrers, recent] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS clicks, COUNT(DISTINCT ip_hash) AS unique_visitors, MAX(clicked_at) AS last_clicked_at
         FROM clicks WHERE url_id = $1`,
      [id]
    ),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date, COUNT(c.id) AS clicks
         FROM generate_series((now() AT TIME ZONE $2)::date - 13, (now() AT TIME ZONE $2)::date, interval '1 day') AS d
         LEFT JOIN clicks c ON c.url_id = $1 AND (c.clicked_at AT TIME ZONE $2)::date = d::date
        GROUP BY d ORDER BY d`,
      [id, TIMEZONE]
    ),
    pool.query(
      `SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*) AS clicks
         FROM clicks WHERE url_id = $1 GROUP BY 1 ORDER BY 2 DESC`,
      [id]
    ),
    pool.query(
      `SELECT ${REFERRER_HOST} AS name, COUNT(*) AS clicks
         FROM clicks WHERE url_id = $1 GROUP BY 1 ORDER BY 2 DESC LIMIT 8`,
      [id]
    ),
    pool.query(
      `SELECT id, clicked_at, device_type, referrer, user_agent
         FROM clicks WHERE url_id = $1 ORDER BY clicked_at DESC, id DESC LIMIT 20`,
      [id]
    ),
  ]);

  const t = totals.rows[0];

  res.json({
    link: toUrlDto({ ...link.rows[0], click_count: t.clicks }),
    totalClicks: Number(t.clicks),
    uniqueVisitors: Number(t.unique_visitors),
    lastClickedAt: t.last_clicked_at,
    daily: daily.rows.map((r) => ({ date: r.date, clicks: Number(r.clicks) })),
    devices: toCount(devices.rows),
    referrers: toCount(referrers.rows),
    recentClicks: recent.rows.map((r) => ({
      id: Number(r.id),
      clickedAt: r.clicked_at,
      deviceType: r.device_type,
      referrer: r.referrer,
      userAgent: r.user_agent,
    })),
  });
});

// PATCH /api/urls/:id  { isActive }
router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { isActive } = req.body ?? {};
  if (typeof isActive !== 'boolean') throw new ValidationError('isActive ต้องเป็น true หรือ false');

  const { rows } = await pool.query(
    `UPDATE urls u SET is_active = $2 WHERE u.id = $1
     RETURNING ${URL_COLUMNS}, (SELECT COUNT(*) FROM clicks c WHERE c.url_id = u.id) AS click_count`,
    [id, isActive]
  );
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบลิงก์' });
  res.json(toUrlDto(rows[0]));
});

// DELETE /api/urls/:id  (clicks are removed by ON DELETE CASCADE)
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM urls WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'ไม่พบลิงก์' });
  res.status(204).end();
});

export default router;
