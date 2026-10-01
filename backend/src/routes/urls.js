import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { pool } from '../db.js';
import { normalizeUrl, validateCustomCode, ValidationError } from '../utils/url.js';
import { baseUrl, toUrlDto } from '../utils/format.js';
import { requireAuth } from '../auth.js';

const router = Router();
router.use(requireAuth);

const generateCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7);
const TIMEZONE = process.env.STATS_TIMEZONE || 'Asia/Bangkok';
const UNIQUE_VIOLATION = '23505';

const URL_COLUMNS = `u.id, u.original_url, u.short_code, u.is_active, u.expires_at, u.created_at, u.user_id`;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('id ไม่ถูกต้อง');
  return id;
}

// Whose links a request may see, passed to SQL as $1 (NULL = every link).
// Users only ever see their own; admins see all, or one user via ?userId=.
function ownerScope(req) {
  if (req.user.role !== 'admin') return req.user.id;
  return req.query.userId ? parseId(req.query.userId) : null;
}
const OWNED = '($1::int IS NULL OR u.user_id = $1)';

// A link outside the caller's scope answers 404, so its existence isn't revealed
async function findOwnedLink(req, id) {
  const { rows } = await pool.query(`SELECT ${URL_COLUMNS} FROM urls u WHERE u.id = $1`, [id]);
  const link = rows[0];
  if (!link || (req.user.role !== 'admin' && link.user_id !== req.user.id)) return null;
  return link;
}

function parseExpiresAt(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError('วันหมดอายุไม่ถูกต้อง');
  if (date <= new Date()) throw new ValidationError('วันหมดอายุต้องเป็นเวลาในอนาคต');
  return date;
}

// POST /api/urls
router.post('/', async (req, res) => {
  const { url, customCode, expiresAt } = req.body ?? {};
  const originalUrl = normalizeUrl(url, baseUrl());
  const values = [originalUrl, parseExpiresAt(expiresAt), req.user.id];
  const insert = `INSERT INTO urls (original_url, expires_at, user_id, short_code)
                  VALUES ($1, $2, $3, $4)
                  RETURNING id, original_url, short_code, is_active, expires_at, created_at, user_id`;

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

// GET /api/urls?search=&userId=
router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const params = [ownerScope(req)];
  let where = OWNED;
  if (search) {
    params.push(`%${search}%`);
    where += ' AND (u.original_url ILIKE $2 OR u.short_code ILIKE $2)';
  }

  const { rows } = await pool.query(
    `SELECT ${URL_COLUMNS}, us.username AS owner_username, COUNT(c.id) AS click_count
       FROM urls u
       LEFT JOIN users us ON us.id = u.user_id
       LEFT JOIN clicks c ON c.url_id = u.id
      WHERE ${where}
      GROUP BY u.id, us.username
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT 500`,
    params
  );
  res.json(rows.map(toUrlDto));
});

const REFERRER_HOST = `COALESCE(regexp_replace(substring(referrer from '^[A-Za-z][A-Za-z0-9+.-]*://([^/:?#]+)'), '^www\\.', ''), 'direct')`;
const toCount = (rows) => rows.map((r) => ({ name: r.name, clicks: Number(r.clicks) }));

// GET /api/urls/summary?userId=  (dashboard: own links, or every link for admins)
router.get('/summary', async (req, res) => {
  const scope = ownerScope(req);
  // Clicks on links inside the scope
  const scopedClicks = `SELECT c.* FROM clicks c JOIN urls u ON u.id = c.url_id WHERE ${OWNED}`;

  const [totals, daily, devices, referrers, topLinks] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM urls u WHERE ${OWNED}) AS total_links,
         (SELECT COUNT(*) FROM urls u
           WHERE ${OWNED} AND u.is_active AND (u.expires_at IS NULL OR u.expires_at > now())) AS active_links,
         (SELECT COUNT(*) FROM (${scopedClicks}) sc) AS total_clicks,
         (SELECT COUNT(DISTINCT ip_hash) FROM (${scopedClicks}) sc) AS unique_visitors,
         (SELECT COUNT(*) FROM (${scopedClicks}) sc
           WHERE (clicked_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date) AS clicks_today`,
      [scope, TIMEZONE]
    ),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date, COUNT(sc.id) AS clicks
         FROM generate_series((now() AT TIME ZONE $2)::date - 13, (now() AT TIME ZONE $2)::date, interval '1 day') AS d
         LEFT JOIN (${scopedClicks}) sc ON (sc.clicked_at AT TIME ZONE $2)::date = d::date
        GROUP BY d ORDER BY d`,
      [scope, TIMEZONE]
    ),
    pool.query(
      `SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*) AS clicks
         FROM (${scopedClicks}) sc GROUP BY 1 ORDER BY 2 DESC`,
      [scope]
    ),
    pool.query(
      `SELECT ${REFERRER_HOST} AS name, COUNT(*) AS clicks
         FROM (${scopedClicks}) sc GROUP BY 1 ORDER BY 2 DESC LIMIT 6`,
      [scope]
    ),
    pool.query(
      `SELECT ${URL_COLUMNS}, us.username AS owner_username, COUNT(c.id) AS click_count
         FROM urls u
         JOIN clicks c ON c.url_id = u.id
         LEFT JOIN users us ON us.id = u.user_id
        WHERE ${OWNED}
        GROUP BY u.id, us.username ORDER BY click_count DESC, u.id DESC LIMIT 5`,
      [scope]
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
  const link = await findOwnedLink(req, id);
  if (!link) return res.status(404).json({ error: 'ไม่พบลิงก์' });

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
    link: toUrlDto({ ...link, click_count: t.clicks }),
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
  if (!(await findOwnedLink(req, id))) return res.status(404).json({ error: 'ไม่พบลิงก์' });

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
  if (!(await findOwnedLink(req, id))) return res.status(404).json({ error: 'ไม่พบลิงก์' });
  const { rowCount } = await pool.query('DELETE FROM urls WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'ไม่พบลิงก์' });
  res.status(204).end();
});

export default router;
