import { LAPS, weekInfo, trackLength } from '../../public/tracks.js';

export const config = { path: '/api/leaderboard' };

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// Talks to Supabase's REST API with the SECRET key (kept in Netlify env vars, never sent to the browser)
const sb = (path, init = {}) => {
  const key = process.env.SUPABASE_SECRET_KEY;
  const headers = { apikey: key, 'content-type': 'application/json', ...(key.startsWith('eyJ') ? { authorization: 'Bearer ' + key } : {}) };
  return fetch(process.env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path, { ...init, headers });
};
const top = async week => {
  const r = await sb(`scores?week=eq.${week}&select=name,time,racer&order=time.asc&limit=50`);
  if (!r.ok) throw new Error('Supabase read failed: ' + r.status);
  return (await r.json()).map(e => ({ ...e, time: Number(e.time) }));
};

export default async (req) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return json({ error: 'Leaderboard is not configured yet' }, 500);
  const wk = weekInfo();                       // the SERVER decides which week/track is current
  const view = async (extra = {}) => json({ week: wk.week, track: wk.track.name, entries: await top(wk.week), ...extra });

  try {
    if (req.method === 'GET') return await view();
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let b; try { b = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }
    const name = String(b.name ?? '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16);
    const time = Math.round(Number(b.time) * 100) / 100, racer = Math.min(4, Math.max(0, Number(b.racer) | 0));
    const fastestPossible = (LAPS * trackLength(wk.track)) / 650;   // top speed incl. boost, with margin

    if (!name) return json({ error: 'Enter a name (letters, numbers, spaces)' }, 400);
    if (b.week !== wk.week) return json({ error: 'A new track just started, so that time is too late. Race again!' }, 409);
    if (!(time >= fastestPossible && time <= 900)) return json({ error: 'That time was rejected' }, 400);

    const r = await sb('rpc/submit_score', { method: 'POST', body: JSON.stringify({ p_week: wk.week, p_name: name, p_time: time, p_racer: racer }) });
    if (!r.ok) throw new Error('Supabase write failed: ' + r.status);
    const { improved, best, rank } = await r.json();
    return await view({ rank, improved, best: Number(best) });
  } catch (e) {
    console.error(e);
    return json({ error: 'Leaderboard is having trouble, try again soon' }, 502);
  }
};
