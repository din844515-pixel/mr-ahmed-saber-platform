const { handleUpload } = require('@vercel/blob/client');
const crypto = require('node:crypto');

const EXPECTED_TEACHER_KEY_HASH = '5c23b5f970c3d551469c8c917e1a53b0d2a2e19d86353117089896f60d6e5763';
function authorizedClientPayload(clientPayload) {
  if (!clientPayload) return false;
  let supplied = '';
  try { supplied = String(JSON.parse(clientPayload).teacherKey || ''); } catch (error) { return false; }
  if (!supplied) return false;
  const configured = process.env.TEACHER_UPLOAD_KEY || '';
  if (configured) {
    const a = Buffer.from(configured), b = Buffer.from(supplied);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  const digest = crypto.createHash('sha256').update(supplied).digest('hex');
  const a = Buffer.from(EXPECTED_TEACHER_KEY_HASH), b = Buffer.from(digest);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function uploadPolicy(pathname) {
  const path = String(pathname || '');
  if (path.startsWith('course-videos/')) return {
    purpose: 'course-lesson-video',
    allowedContentTypes: ['video/mp4','video/webm','video/quicktime','video/x-m4v','video/3gpp','video/3gpp2','video/mpeg','video/ogg','video/x-matroska','video/avi'],
    maximumSizeInBytes: 2 * 1024 * 1024 * 1024
  };
  if (path.startsWith('exam-audio/')) return {
    purpose: 'exam-reference-audio',
    allowedContentTypes: ['audio/mpeg','audio/mp3','audio/mp4','audio/aac','audio/wav','audio/x-wav','audio/webm','audio/ogg','audio/3gpp','audio/3gpp2','video/mp4','video/quicktime','video/webm'],
    maximumSizeInBytes: 150 * 1024 * 1024
  };
  if (path.startsWith('assignment-files/')) return {
    purpose: 'assignment-attachment',
    allowedContentTypes: ['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','audio/mpeg','audio/mp4','audio/webm','video/mp4'],
    maximumSizeInBytes: 40 * 1024 * 1024
  };
  return null;
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const response = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!authorizedClientPayload(clientPayload)) throw new Error('رمز الرفع غير صحيح. اكتبيه من جديد.');
        const policy = uploadPolicy(pathname);
        if (!policy) throw new Error('مسار رفع الملف غير صالح.');
        return {
          allowedContentTypes: policy.allowedContentTypes,
          maximumSizeInBytes: policy.maximumSizeInBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ purpose: policy.purpose })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let info = {};
        try { info = JSON.parse(tokenPayload || '{}'); } catch (error) {}
        console.log('Platform file uploaded', info.purpose || 'unknown', blob.pathname);
      }
    });
    return res.status(200).json(response);
  } catch (error) {
    const message = error && error.message ? error.message : 'Upload authorization failed';
    console.error('platform file upload failed', message);
    const status = message.includes('رمز الرفع') ? 401 : 400;
    return res.status(status).json({ error: message });
  }
};
