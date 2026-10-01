const MAX_URL_LENGTH = 2048;

export class ValidationError extends Error {}

// Adds https:// when the scheme is missing, accepts only http/https,
// and refuses links to this service itself to avoid redirect loops.
export function normalizeUrl(input, baseUrl) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError('กรุณากรอก URL');
  }

  let value = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  if (value.length > MAX_URL_LENGTH) throw new ValidationError('URL ยาวเกินไป');

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError('รูปแบบ URL ไม่ถูกต้อง');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError('รองรับเฉพาะลิงก์ http และ https');
  }
  if (url.hostname !== 'localhost' && !url.hostname.includes('.')) {
    throw new ValidationError('รูปแบบ URL ไม่ถูกต้อง');
  }
  if (baseUrl && url.host === new URL(baseUrl).host) {
    throw new ValidationError('ไม่สามารถย่อลิงก์ของระบบนี้ได้');
  }

  return url.href;
}

const RESERVED_CODES = new Set(['api', 'health', 'favicon.ico', 'robots.txt']);

export function validateCustomCode(code) {
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(code)) {
    throw new ValidationError('รหัสลิงก์ต้องเป็น a-z, A-Z, 0-9, - หรือ _ ยาว 3-20 ตัวอักษร');
  }
  if (RESERVED_CODES.has(code.toLowerCase())) {
    throw new ValidationError('รหัสนี้ถูกสงวนไว้สำหรับระบบ');
  }
  return code;
}
