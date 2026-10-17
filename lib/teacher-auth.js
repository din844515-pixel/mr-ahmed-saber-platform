const SUPABASE_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';

function bearerFrom(req) {
  const value = String(req && req.headers && req.headers.authorization || '');
  const match = value.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : '';
}

async function verifyTeacherToken(token) {
  if (!token || token.length > 12000) return false;
  try {
    const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: 'Bearer ' + token,
        accept: 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) return false;
    const user = await response.json();
    const metadata = user && (user.app_metadata || user.raw_app_meta_data) || {};
    const roles = Array.isArray(metadata.roles) ? metadata.roles : [];
    return metadata.role === 'teacher' || metadata.role === 'admin' ||
      roles.includes('teacher') || roles.includes('admin');
  } catch (_) {
    return false;
  }
}

async function isTeacherRequest(req) {
  return verifyTeacherToken(bearerFrom(req));
}

module.exports = isTeacherRequest;
module.exports.verifyTeacherToken = verifyTeacherToken;
module.exports.bearerFrom = bearerFrom;
