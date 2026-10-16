// Shared by the game (browser) and the leaderboard function (server).
export const LAPS = 3;
export const TZ = 'America/New_York';          // time zone the "Friday 9:00 AM" switch happens in
export const ANCHOR = Date.UTC(2026, 0, 2, 9, 0, 0); // a Friday 9:00 AM (wall-clock) = start of week 0 / track #1

// closed loop from a wobbly polar curve: k lobes, amplitude a, phase ph, x/y radii, squareness q, extra harmonic b*m
const ring = (k, a, ph, ex, ey, q = 1, n = 18, b = 0, m = 0) => Array.from({ length: n }, (_, i) => {
  const t = i / n * 2 * Math.PI, r = 1 + a * Math.cos(k * t + ph) + b * Math.cos(m * t), f = v => Math.sign(v) * Math.abs(v) ** q;
  return [Math.round(1300 + ex * r * f(Math.cos(t))), Math.round(850 + ey * r * f(Math.sin(t)))];
});
const th = (bg, gr, road, hatch, ink, deco, dc, rain) => ({ bg, gr, road, hatch, ink, deco, dc, ...(rain ? { rain: 1 } : {}) });

export const TRACKS = [
  { name: 'Pencil Pines', t: 'Gentle oval to learn the ropes', w: 160, pts: ring(2, .12, 0, 920, 520), th: th('#f4f0e6', '#bfd9b0', '#ece4d0', '#c9bc9a', '#26302b', 'tree', '#4f8f5a') },
  { name: 'Crayon Canyon', t: 'Three big sweeping corners', w: 150, pts: ring(3, .2, .6, 880, 540), th: th('#fbe0d0', '#e8b894', '#f5dcc2', '#d4a074', '#4a2a1c', 'rock', '#b5693f') },
  { name: 'Sketchbook Snow', t: 'Blocky corners, icy straights', w: 150, pts: ring(4, .14, .4, 880, 560, .7, 20), th: th('#eef4fa', '#dfe9f3', '#ffffff', '#c4d4e8', '#1d3557', 'tree', '#8fb3d9') },
  { name: 'Midnight Marker', t: 'Five-pointed night run', w: 145, pts: ring(5, .06, 0, 900, 560, 1, 24), th: th('#0b0b24', '#10102c', '#232350', '#3a3a78', '#ffffff', 'star', '#fff') },
  { name: 'Lemonade Loop', t: 'Fat egg with a tight squeeze', w: 150, pts: ring(1, .3, 0, 880, 500, 1, 14), th: th('#fff6bf', '#f7e78a', '#fffbe0', '#e6d27a', '#5a4300', 'tree', '#d9a400') },
  { name: 'Bubblegum Bend', t: 'Six wobbly bumps', w: 145, pts: ring(6, .04, 0, 920, 570, 1, 28), th: th('#ffe3ef', '#ffc7de', '#fff2f8', '#f5aac8', '#5b1a3a', 'tree', '#e0568f') },
  { name: 'Mint Marshland', t: 'Lumpy lagoon lap', w: 145, pts: ring(3, .15, 1, 880, 520, 1, 22, .04, 5), th: th('#e1f5ee', '#b8e3d2', '#f0fbf6', '#96cdb8', '#134a3a', 'tree', '#2f9c7a') },
  { name: 'Grape Gulch', t: 'Twilight twister', w: 145, pts: ring(2, .26, 1.57, 900, 500, 1, 20, .1, 4), th: th('#2a1b3d', '#3a2656', '#54397a', '#70509c', '#f3e8ff', 'rock', '#8a62c4') },
  { name: 'Sandstorm Sprint', t: 'Long straights, hard turns', w: 150, pts: ring(2, .2, 0, 950, 430, .55, 16), th: th('#f6e3b4', '#e9c985', '#f9edc9', '#d9b46a', '#4d3512', 'rock', '#b8863b') },
  { name: 'Ocean Doodle', t: 'Wave-riding wiggles', w: 140, pts: ring(7, .035, 0, 920, 570, 1, 32), th: th('#dff1f7', '#a9d8e6', '#f4fbfd', '#86bfd2', '#0f3b52', 'tree', '#3f94b5') },
  { name: 'Volcano Scrawl', t: 'Crater rim with a kink', w: 145, pts: ring(4, .2, .8, 860, 540, 1, 20, .1, 2), th: th('#2b1a1a', '#4a2420', '#6b3a30', '#8c4c3d', '#ffe9d6', 'rock', '#e2572e') },
  { name: 'Cotton Candy Cloud', t: 'Puffy cloud bumps', w: 145, pts: ring(5, .06, .3, 920, 570, 1, 28), th: th('#efe6ff', '#d9c8ff', '#fbf8ff', '#c0a8f2', '#3b2a73', 'tree', '#9a7bea') },
  { name: 'Autumn Scribble', t: 'Leaf-shaped swoops', w: 150, pts: ring(3, .12, 2, 900, 540, 1, 18, .18, 1), th: th('#fbe9d0', '#e8c48a', '#fff1da', '#d4a05a', '#4a2a12', 'tree', '#d9632b') },
  { name: 'Neon Chalkboard', t: 'Rounded-square night circuit', w: 150, pts: ring(4, .08, 0, 880, 560, .6, 20), th: th('#14201c', '#1b2c26', '#2b4a40', '#3f6b5c', '#eafff4', 'star', '#fff') },
  { name: 'Aurora Ribbon', t: 'Rainbow road, but wiggly', w: 145, om: .8, pts: ring(5, .08, .5, 900, 550, .9, 24, .04, 3), th: th('#0b0b24', '#10102c', '#232350', '#3a3a78', '#ffffff', 'star', '#fff', 1) },
];

// ---- weekly rotation: switches every Friday 9:00 AM in TZ (wall-clock maths, so DST-safe) ----
const WEEK = 7 * 864e5;
const wall = ms => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(ms).map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
};
export function weekInfo(now = Date.now()) {
  const w = wall(now), week = Math.floor((w - ANCHOR) / WEEK), index = ((week % TRACKS.length) + TRACKS.length) % TRACKS.length;
  return { week, index, track: TRACKS[index], msLeft: ANCHOR + (week + 1) * WEEK - w };
}

// centre-line length (same Catmull-Rom as the game) — used by the server to reject impossible times
const cr = (a, b, c, d, u) => .5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
export function trackLength(t) {
  const C = t.pts, n = C.length, D = [];
  for (let i = 0; i < n; i++) { const a = C[(i + n - 1) % n], b = C[i], c = C[(i + 1) % n], d = C[(i + 2) % n]; for (let k = 0; k < 24; k++) { const u = k / 24; D.push([cr(a[0], b[0], c[0], d[0], u), cr(a[1], b[1], c[1], d[1], u)]); } }
  let L = 0; for (let i = 0; i < D.length; i++) { const p = D[i], q = D[(i + 1) % D.length]; L += Math.hypot(q[0] - p[0], q[1] - p[1]); }
  return L;
}
