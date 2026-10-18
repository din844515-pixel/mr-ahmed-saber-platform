const SUPABASE_URL = 'https://umffvtnujqjmgrrfmsdk.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_bbmAuU_9UGd1IrJXBS8Bkg_BI5lpSXV';
const TABLE_URL = SUPABASE_URL + '/rest/v1/platform_testimonials';

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\\s+/g, ' ').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method === 'GET') {
    try {
      const upstream = await fetch(TABLE_URL + '?select=id,student_name,education_stage,review_text,created_at&order=created_at.desc&limit=30', {
        headers: { apikey: PUBLISHABLE_KEY, authorization: 'Bearer ' + PUBLISHABLE_KEY, accept: 'application/json' },
        cache: 'no-store'
      });
      if (!upstream.ok) return res.status(502).json({ ok: false, error: 'تعذر تحميل آراء الطلاب حاليًا.' });
      const reviews = await upstream.json();
      return res.status(200).json({ ok: true, reviews: Array.isArray(reviews) ? reviews : [] });
    } catch (error) {
      console.error('public testimonials read failed', error && error.message);
      return res.status(502).json({ ok: false, error: 'تعذر تحميل آراء الطلاب حاليًا.' });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const student_name = clean(body.student_name, 80);
  const education_stage = clean(body.education_stage, 80);
  const review_text = clean(body.review_text, 700);
  if (student_name.length < 2 || education_stage.length < 2 || review_text.length < 10) {
    return res.status(400).json({ ok: false, error: 'اكتب اسمك والمرحلة ورأيًا لا يقل عن 10 أحرف.' });
  }
  try {
    const upstream = await fetch(TABLE_URL + '?select=id,student_name,education_stage,review_text,created_at', {
      method: 'POST',
      headers: {
        apikey: PUBLISHABLE_KEY,
        authorization: 'Bearer ' + PUBLISHABLE_KEY,
        'content-type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ student_name, education_stage, review_text })
    });
    if (!upstream.ok) {
      console.error('public testimonial create failed', upstream.status);
      return res.status(502).json({ ok: false, error: 'لم نتمكن من حفظ رأيك الآن. حاول مرة أخرى.' });
    }
    const rows = await upstream.json();
    return res.status(201).json({ ok: true, review: Array.isArray(rows) ? rows[0] : null });
  } catch (error) {
    console.error('public testimonial create failed', error && error.message);
    return res.status(502).json({ ok: false, error: 'لم نتمكن من حفظ رأيك الآن. حاول مرة أخرى.' });
  }
};
