const crypto = require('node:crypto');

const SUPABASE_FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-students';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';

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

  const supplied = String(req.headers['x-teacher-key'] || '');
  const expectedHash = '5c23b5f970c3d551469c8c917e1a53b0d2a2e19d86353117089896f60d6e5763';
  const actualHash = crypto.createHash('sha256').update(supplied).digest('hex');
  if (!supplied || !safeEqual(expectedHash, actualHash)) {
    return res.status(401).json({ error: 'رمز المزامنة غير صحيح.' });
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
