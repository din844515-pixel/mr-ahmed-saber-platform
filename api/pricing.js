const FUNCTION_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/platform-academics';
const isTeacherRequest = require('../lib/teacher-auth');
const SUPABASE_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET') {
    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/platform_pricing?select=item_type,item_name,education_stage,price_egp,is_active,updated_at&is_active=eq.true&order=item_type.asc,education_stage.asc,item_name.asc', {
        headers: { apikey: PUBLISHABLE_KEY, authorization: 'Bearer ' + PUBLISHABLE_KEY, accept: 'application/json' },
        cache: 'no-store'
      });
      const text = await response.text();
      if (!response.ok) return res.status(502).json({ error: 'تعذر تحميل الأسعار حاليًا.' });
      return res.status(200).json({ ok: true, pricing: JSON.parse(text) });
    } catch (error) {
      console.error('public pricing read failed', error && error.message);
      return res.status(502).json({ error: 'تعذر تحميل الأسعار حاليًا.' });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const key = String(req.headers['x-teacher-key'] || '');
  const tokenAuthorized = await isTeacherRequest(req);
  if (!tokenAuthorized && !key) return res.status(401).json({ error: 'سجّل الدخول بحساب المستر لإدارة الأسعار.' });
  try {
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: PUBLISHABLE_KEY, ...(tokenAuthorized ? { authorization: String(req.headers.authorization || '') } : { 'x-teacher-key': key }), accept: 'application/json' },
      body: JSON.stringify(req.body && typeof req.body === 'object' ? req.body : {}),
      cache: 'no-store'
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: 'استجابة غير صالحة من خدمة الأسعار.' }; }
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('pricing proxy failed', error && error.message);
    return res.status(502).json({ error: 'تعذر الاتصال بخدمة الأسعار.' });
  }
};
