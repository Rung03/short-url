import crypto from 'node:crypto';

// Stores a salted SHA-256 of the IP so unique visitors can be counted
// without keeping the real address.
export function hashIp(ip) {
  if (!ip) return null;
  const salt = process.env.IP_SALT || '';
  return crypto.createHash('sha256').update(salt + ip).digest('hex');
}
