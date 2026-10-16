const { list, put } = require('@vercel/blob');
const crypto = require('node:crypto');

const COURSE_PATH = 'platform/course-index-v1.json';

function authorized(req) {
  const expected = process.env.TEACHER_UPLOAD_KEY || '';
  const supplied = String(req.headers['x-teacher-key'] || '');
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'GET') {
    try {
      const result = await list({ prefix: COURSE_PATH, limit: 20 });
      const blob = (result.blobs || []).find(item => item.pathname === COURSE_PATH);
      if (!blob) return res.status(200).json({ exists: false, courses: [] });
      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to read course index');
      const data = await response.json();
      return res.status(200).json({
        exists: true,
        courses: Array.isArray(data.courses) ? data.courses : [],
        updatedAt: data.updatedAt || null
      });
    } catch (error) {
      console.error('course index read failed', error && error.message);
      return res.status(503).json({ error: 'تعذر تحميل الكورسات المشتركة مؤقتًا.' });
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authorized(req)) return res.status(401).json({ error: 'رمز الرفع غير صحيح. اكتبيه من جديد.' });

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!Array.isArray(body.courses) || body.courses.length > 500) {
      return res.status(400).json({ error: 'بيانات الكورسات غير صالحة.' });
    }
    const payload = JSON.stringify({ courses: body.courses, updatedAt: new Date().toISOString() });
    if (Buffer.byteLength(payload, 'utf8') > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'بيانات الكورسات أكبر من الحد المسموح.' });
    }
    await put(COURSE_PATH, payload, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('course index write failed', error && error.message);
    return res.status(500).json({ error: 'تعذر نشر الكورسات. حاولي مرة أخرى.' });
  }
};
