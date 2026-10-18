module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  try {
    const upstream=await fetch('https://umffvtnujqjmgrrfmsdk.supabase.co/functions/v1/photo-import-once',{method:'GET',cache:'no-store'});
    const body=await upstream.text();
    let data; try { data=JSON.parse(body); } catch { data={detail:body.slice(0,300)}; }
    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error('photo import proxy failed',error&&error.message);
    return res.status(502).json({ok:false,error:'Photo import service could not be reached.'});
  }
};
