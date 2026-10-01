import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import urlsRouter from './routes/urls.js';
import redirectRouter from './routes/redirect.js';
import { ValidationError } from './utils/url.js';

const app = express();
const PORT = process.env.PORT || 4000;
const corsSetting = (process.env.CORS_ORIGIN || 'http://localhost:5173').trim();
const origins = corsSetting === '*' ? '*' : corsSetting.split(',').map((s) => s.trim().replace(/\/+$/, ''));

// Behind Render/Vercel proxies, read the visitor IP from X-Forwarded-For
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'ok', database: 'disconnected' });
  }
});

app.use('/api/urls', urlsRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ endpoint' }));

app.get('/', (req, res) => res.json({ name: 'Short URL API', health: '/api/health' }));
app.use(redirectRouter);

// Express 5 forwards rejected promises from async handlers here
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON ไม่ถูกต้อง' });
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

try {
  await migrate(pool);
} catch (err) {
  // Keep serving so /api/health can report the database problem
  console.error('Database migration failed:', err.message);
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
