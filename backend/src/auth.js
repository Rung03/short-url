import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const TOKEN_TTL = '7d';

// Without JWT_SECRET, tokens only survive until the server restarts.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set: using a random secret, everyone is logged out on restart.');
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

export const isPrimaryAdmin = (user) =>
  Boolean(process.env.ADMIN_USERNAME) && user.username === process.env.ADMIN_USERNAME.trim().toLowerCase();

export function toUserDto(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isPrimaryAdmin: isPrimaryAdmin(row),
    createdAt: row.created_at,
  };
}

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Loads the user on every request so role changes apply immediately.
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AuthError('กรุณาเข้าสู่ระบบ');

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new AuthError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }

  const { rows } = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [
    Number(payload.sub),
  ]);
  if (!rows.length) throw new AuthError('ไม่พบบัญชีผู้ใช้');
  req.user = rows[0];
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') throw new AuthError('ต้องเป็นผู้ดูแลระบบ', 403);
  next();
}

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;

export function parseCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { username, password };
}

export function validateUsername(username) {
  if (!USERNAME_RE.test(username)) {
    throw new AuthError('ชื่อผู้ใช้ต้องเป็น a-z, 0-9, _ . - ยาว 3-30 ตัวอักษร', 400);
  }
}

export function validatePassword(password) {
  // bcrypt only uses the first 72 bytes
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new AuthError('รหัสผ่านต้องยาว 8-72 ตัวอักษร', 400);
  }
}

// Creates or updates the primary admin from ADMIN_USERNAME / ADMIN_PASSWORD,
// then gives links created before accounts existed to that admin.
export async function ensurePrimaryAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn('ADMIN_USERNAME / ADMIN_PASSWORD not set: no primary admin.');
    return;
  }
  validateUsername(username);
  validatePassword(password);

  const existing = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
  let adminId;
  if (existing.rows.length) {
    adminId = existing.rows[0].id;
    // Changing ADMIN_PASSWORD on the server resets the primary admin's password
    const same = await checkPassword(password, existing.rows[0].password_hash);
    const hash = same ? existing.rows[0].password_hash : await hashPassword(password);
    await pool.query(`UPDATE users SET role = 'admin', password_hash = $2 WHERE id = $1`, [adminId, hash]);
  } else {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin') RETURNING id`,
      [username, await hashPassword(password)]
    );
    adminId = rows[0].id;
  }

  const { rowCount } = await pool.query('UPDATE urls SET user_id = $1 WHERE user_id IS NULL', [adminId]);
  if (rowCount) console.log(`Assigned ${rowCount} ownerless link(s) to admin "${username}".`);
}

// Simple in-memory limit on failed logins: 5 failures per 15 minutes per IP + username.
const FAILED_LIMIT = 5;
const FAILED_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();

export function loginBlocked(key) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > FAILED_WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= FAILED_LIMIT;
}

export function recordLoginFailure(key) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > FAILED_WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count++;
}

export const clearLoginFailures = (key) => failures.delete(key);
