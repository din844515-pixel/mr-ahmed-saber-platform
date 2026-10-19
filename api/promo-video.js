const { list, put } = require('@vercel/blob');
const crypto = require('node:crypto');
const isTeacherRequest = require('../lib/teacher-auth');

const PROMO_PATH = 'platform/homepage-promo-video-v1.json';
const PROMO_PREFIX = 'promo-videos/';

function authorizedByUploadKey(req) {
  const expected = process.env.TEACHER_UPLOAD_KEY || '';
  const supplied = String(req.headers['x-teacher-key'] || '');
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function readPromo() {
  const result = await list({ prefix: PROMO_PATH, limit: 20 });
  const blob = (result.blobs || []).find(item => item.pathname === PROMO_PATH);
  if (!blob) return { active: false, video: null };
  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to read promotional video metadata');
  const value = await response.json();
  if (!value || value.active !== true || !value.videoUrl) return { active: false, video: null };
  return {
    active: true,
    video: {
      videoUrl: String(value.videoUrl),
      filename: String(value.filename || 'homepage-promo-video'),
      size: Number(value.size) || 0,
      mimeType: String(value.mimeType || 'video/mp4'),
      publishedAt: value.publishedAt || null
    }
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'GET') {
    try {
      const promo = await readPromo();
      return res.status(200).json({ ok: true, ...promo });
    } catch (error) {
      console.error('homepage promo video read failed', error && error.message);
      return res.status(503).json({ ok: false, error: 'تعذر تحميل الفيديو الإعلاني حاليًا.' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const tokenAuthorized = await isTeacherRequest(req);
  if (!tokenAuthorized && !authorizedByUploadKey(req)) {
    return res.status(401).json({ ok: false, error: 'سجّل الدخول بحساب المستر لحفظ الفيديو الإعلاني.' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || 'publish');
    if (action === 'unpublish') {
      await put(PROMO_PATH, JSON.stringify({ active: false, updatedAt: new Date().toISOString() }), {
        access: 'public',
        contentType: 'application/json; charset=utf-8',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      return res.status(200).json({ ok: true, active: false });
    }

    const videoUrl = String(body.videoUrl || '').trim();
    const filename = String(body.filename || 'homepage-promo-video').trim().slice(0, 180);
    const size = Number(body.size) || 0;
    const mimeType = String(body.mimeType || 'video/mp4').toLowerCase();
    let parsed;
    try { parsed = new URL(videoUrl); } catch (_) { parsed = null; }
    if (!parsed || parsed.protocol !== 'https:' ||
        !parsed.hostname.endsWith('public.blob.vercel-storage.com') ||
        !parsed.pathname.includes('/promo-videos/') ||
        !mimeType.startsWith('video/') || size <= 0 || size > 2 * 1024 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: 'بيانات الفيديو غير صالحة. ارفع ملف الفيديو من المعرض ثم أعد الحفظ.' });
    }

    const publishedAt = new Date().toISOString();
    const payload = JSON.stringify({ active: true, videoUrl, filename, size, mimeType, publishedAt });
    await put(PROMO_PATH, payload, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return res.status(200).json({ ok: true, active: true, video: { videoUrl, filename, size, mimeType, publishedAt } });
  } catch (error) {
    console.error('homepage promo video save failed', error && error.message);
    return res.status(500).json({ ok: false, error: 'تعذر حفظ الفيديو الإعلاني. حاول مرة أخرى.' });
  }
};
