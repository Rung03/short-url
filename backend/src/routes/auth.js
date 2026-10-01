import { Router } from 'express';
import { pool } from '../db.js';
import {
  AuthError,
  checkPassword,
  clearLoginFailures,
  hashPassword,
  loginBlocked,
  parseCredentials,
  recordLoginFailure,
  requireAuth,
  signToken,
  toUserDto,
  validatePassword,
  validateUsername,
} from '../auth.js';

const router = Router();
const UNIQUE_VIOLATION = '23505';

// POST /api/auth/register  { username, password }
router.post('/register', async (req, res) => {
  const { username, password } = parseCredentials(req.body);
  validateUsername(username);
  validatePassword(password);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2)
       RETURNING id, username, role, created_at`,
      [username, await hashPassword(password)]
    );
    res.status(201).json({ token: signToken(rows[0]), user: toUserDto(rows[0]) });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw new AuthError('ชื่อผู้ใช้นี้ถูกใช้แล้ว', 409);
    throw err;
  }
});

// POST /api/auth/login  { username, password }
router.post('/login', async (req, res) => {
  const { username, password } = parseCredentials(req.body);
  const key = `${req.ip}|${username}`;
  if (loginBlocked(key)) throw new AuthError('เข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่', 429);

  const { rows } = await pool.query(
    'SELECT id, username, role, created_at, password_hash FROM users WHERE username = $1',
    [username]
  );
  const user = rows[0];
  // Same message for unknown user and wrong password, so usernames can't be probed
  if (!user || !(await checkPassword(password, user.password_hash))) {
    recordLoginFailure(key);
    throw new AuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  clearLoginFailures(key);
  res.json({ token: signToken(user), user: toUserDto(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: toUserDto(req.user) });
});

export default router;
