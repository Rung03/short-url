import { Router } from 'express';
import { pool } from '../db.js';
import { AuthError, hashPassword, isPrimaryAdmin, requireAdmin, requireAuth, toUserDto, validatePassword } from '../auth.js';

// Admin only: list users, change roles, reset passwords, delete users
const router = Router();
router.use(requireAuth, requireAdmin);

async function findUser(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) throw new AuthError('id ไม่ถูกต้อง', 400);
  const { rows } = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
  if (!rows.length) throw new AuthError('ไม่พบผู้ใช้', 404);
  return rows[0];
}

// GET /api/users
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT us.id, us.username, us.role, us.created_at,
            COUNT(DISTINCT u.id) AS link_count,
            COUNT(c.id) AS click_count
       FROM users us
       LEFT JOIN urls u ON u.user_id = us.id
       LEFT JOIN clicks c ON c.url_id = u.id
      GROUP BY us.id
      ORDER BY us.created_at, us.id`
  );
  res.json(
    rows.map((r) => ({ ...toUserDto(r), linkCount: Number(r.link_count), clickCount: Number(r.click_count) }))
  );
});

// PATCH /api/users/:id  { role: 'user' | 'admin' }
router.patch('/:id', async (req, res) => {
  const target = await findUser(req.params.id);
  const { role } = req.body ?? {};
  if (role !== 'user' && role !== 'admin') throw new AuthError('role ต้องเป็น user หรือ admin', 400);
  if (isPrimaryAdmin(target)) throw new AuthError('เปลี่ยนสิทธิ์ผู้ดูแลระบบหลักไม่ได้', 403);
  if (target.id === req.user.id) throw new AuthError('เปลี่ยนสิทธิ์ของตัวเองไม่ได้', 403);

  const { rows } = await pool.query(
    'UPDATE users SET role = $2 WHERE id = $1 RETURNING id, username, role, created_at',
    [target.id, role]
  );
  res.json(toUserDto(rows[0]));
});

// DELETE /api/users/:id  removes the user and their links (clicks cascade)
router.delete('/:id', async (req, res) => {
  const target = await findUser(req.params.id);
  if (isPrimaryAdmin(target)) throw new AuthError('ลบผู้ดูแลระบบหลักไม่ได้', 403);
  if (target.id === req.user.id) throw new AuthError('ลบบัญชีของตัวเองไม่ได้', 403);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM urls WHERE user_id = $1', [target.id]);
    await client.query('DELETE FROM users WHERE id = $1', [target.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.status(204).end();
});

// POST /api/users/:id/password  { password }  (no email, so admins reset forgotten passwords)
router.post('/:id/password', async (req, res) => {
  const target = await findUser(req.params.id);
  if (isPrimaryAdmin(target)) throw new AuthError('รหัสผ่านผู้ดูแลระบบหลักเปลี่ยนได้ที่ ADMIN_PASSWORD บนเซิร์ฟเวอร์', 403);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  validatePassword(password);

  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [target.id, await hashPassword(password)]);
  res.status(204).end();
});

export default router;
