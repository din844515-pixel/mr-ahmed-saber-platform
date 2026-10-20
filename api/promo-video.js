const { list, put } = require('@vercel/blob');
const crypto = require('node:crypto');
const isTeacherRequest = require('../lib/teacher-auth');

const PROMO_PATH = 'platform/homepage-promo-video-v1.json';
const PROMO_PREFIX = 'promo-videos/';
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;
const VIDEO_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.3gp': 'video/3gpp',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.ogg': 'video/ogg',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/avi'
};

function authorizedByUploadKey(req) {
  const expected = process.env.TEACHER_UPLOAD_KEY || '';
  const supplied = String(req.headers['x-teacher-key'] || '');
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicPromoBlob(blob) {
  if (!blob || typeof blob.url !== 'string' || !blob.pathname ||
      !String(blob.pathname).startsWith(PROMO_PREFIX) ||
      !Number.isFinite(Number(blob.size)) || Number(blob.size) <= 0 ||
      Number(blob.size) > MAX_VIDEO_SIZE) return false;
  try {
    const url = new URL(blob.url);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('public.blob.vercel-storage.com')) return false;
    const pathname = String(blob.pathname);
    const filename = pathname.slice(PROMO_PREFIX.length).split('/').pop() || '';
    const dot = filename.lastIndexOf('.');
    const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
    return Boolean(VIDEO_TYPES[ext]);
  } catch (_) {
    return false;
  }
}

function asPromoVideo(blob, recoveredUpload) {
  const pathname = String(blob.pathname || '');
  const filename = pathname.slice(PROMO_PREFIX.length).split('/').pop() || 'homepage-promo-video';
  const dot = filename.lastIndexOf('.');
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  return {
    videoUrl: String(blob.url),
    filename,
    size: Number(blob.size) || 0,
    mimeType: VIDEO_TYPES[ext] || 'video/mp4',
    publishedAt: blob.uploadedAt || null,
    ...(recoveredUpload ? { recoveredUpload: true } : {})
  };
}

async function readLatestUploadedPromo() {
  const result = await list({ prefix: PROMO_PREFIX, limit: 100 });
  const candidates = (result.blobs || []).filter(publicPromoBlob);
  candidates.sort((a, b) => {
    const dateB = Date.parse(b.uploadedAt || '') || 0;
    const dateA = Date.parse(a.uploadedAt || '') || 0;
    return dateB - dateA;
  });
  if (!candidates.length) return { active: false, video: null };
  return { active: true, video: asPromoVideo(candidates[0], true) };
}

async function readPromo() {
  const result = await list({ prefix: PROMO_PATH, limit: 20 });
  const blob = (result.blobs || []).find(item => item.pathname === PROMO_PATH);
  if (!blob) {
    // If file upload succeeded but saving its publish metadata failed, recover
    // the newest valid promotional upload instead of leaving the homepage empty.
    return await readLatestUploadedPromo();
  }
  const response = await fetch(blob.url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to read promotional video metadata');
  const value = await response.json();
  if (!value || value.active !== true || !value.videoUrl) {
    // A prior unpublish must remain effective unless a newer promo upload exists.
    // This also recovers when uploading the new clip succeeded but saving metadata failed.
    const latest = await readLatestUploadedPromo();
    const uploadedAt = Date.parse(latest.video && latest.video.publishedAt || '') || 0;
    const unpublishedAt = Date.parse(value && value.updatedAt || '') || 0;
    if (latest.active && uploadedAt > unpublishedAt) return latest;
    return { active: false, video: null };
  }
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
        !mimeType.startsWith('video/') || size <= 0 || size > MAX_VIDEO_SIZE) {
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
