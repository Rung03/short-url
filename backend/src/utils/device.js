// Classifies a User-Agent into mobile / tablet / desktop / bot / unknown.
// Order matters: bots fake mobile UAs, and Android tablets also say "android".
export function detectDevice(userAgent) {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();

  if (/bot|crawler|spider|slurp|facebookexternalhit|curl|wget|python-requests|httpclient/.test(ua)) return 'bot';
  if (/ipad|tablet|kindle|silk|playbook/.test(ua) || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet';
  }
  if (/mobi|iphone|ipod|android|blackberry|windows phone|opera mini/.test(ua)) return 'mobile';
  if (/windows|macintosh|linux|cros/.test(ua)) return 'desktop';
  return 'unknown';
}
