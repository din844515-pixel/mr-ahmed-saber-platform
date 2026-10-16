const crypto = require('node:crypto');

const SUPABASE_FUNCTION_URL = 'https://gfzzuxzrvysuodehjkyq.supabase.co/functions/v1/platform-students';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rb8JsRCgD3ry78YabOfDkQ_G4VCKFko';

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.TEACHER_UPLOAD_KEY || '';
  const supplied = String(req.headers['x-teacher-key'] || '');
  if (!safeEqual(expected, supplied)) {
    return res.status(expected ? 401 : 503).json({
      error: expected ? 'رمز المزامنة غير صحيح.' : 'إعداد مزامنة قاعدة الطلاب غير مكتمل.'
    });
  }

  try {
    const options = {
      method: req.method,
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'x-teacher-key': supplied,
        'accept': 'application/json'
      }
    };
    if (req.method === 'POST') {
      options.headers['content-type'] = 'application/json';
      options.body = JSON.stringify(req.body && typeof req.body === 'object' ? req.body : {});
    }
    const upstream = await fetch(SUPABASE_FUNCTION_URL, options);
    const text = await upstream.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = { error: 'استجابة غير صالحة من خدمة الطلاب.' }; }
    return res.status(upstream.status).json(parsed);
  } catch (error) {
    console.error('student registry proxy failed', error && error.message);
    return res.status(502).json({ error: 'تعذر الاتصال بقاعدة الطلاب. حاولي مرة أخرى.' });
  }
};
