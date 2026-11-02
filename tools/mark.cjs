// The Fire & Seed mark as SVG: the hand-drawn flame and sequoia cone, and the "FIRE & SEED" slab words.
// Ported from the patch drawings (repo intrinsic-change-, store/brand/patch-designs/fire-seed-patches.html),
// so the site and the beanie patch are one mark. When the scanned block print exists, it replaces this.
const f = n => n.toFixed(1);

// A hand-drawn line: a centreline through [x, y, width] points, smoothed, filled as a ribbon that swells and thins.
function brush(pts, n = 10) {
  const S = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      S.push([c(0), c(1), p1[2] + (p2[2] - p1[2]) * t]);
    }
  }
  S.push(pts[pts.length - 1]);
  const L = [], R = [];
  S.forEach((p, i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d * p[2] / 2, ny = dx / d * p[2] / 2;
    L.push(f(p[0] + nx) + ',' + f(p[1] + ny)); R.push(f(p[0] - nx) + ',' + f(p[1] - ny));
  });
  return `<path d="M${L.join('L')}L${R.reverse().join('L')}Z"/>`;
}

const FLAME_EDGES = [
  [[86,181,1.5],[66,177,4.5],[50,166,7],[41,148,8],[39,130,6.5],[37,112,5],[32,92,3.2],[30,76,1.8],[33,64,0.5]],
  [[33,64,0.5],[40,74,2.4],[48,88,3.8],[53,101,4.6],[57,88,4],[58,72,3.2],[56,56,2],[52,42,0.5]],
  [[52,42,0.5],[60,54,2.6],[70,68,4],[79,84,5],[82,66,4.4],[88,46,3.6],[98,28,2.6],[110,15,1.4],[121,9,0.5]],
  [[121,9,0.5],[114,22,2.2],[110,40,3.8],[108,60,5.4],[107,78,6],[116,64,4.4],[124,52,3],[128,42,1.8],[126,32,0.5]],
  [[126,32,0.5],[132,46,2.4],[133,64,4],[128,88,5],[138,92,4],[152,90,2.8],[164,86,1.4],[175,80,0.5]],
  [[175,80,0.5],[166,96,2.6],[156,112,4.4],[150,130,6],[146,148,7.5],[136,164,6.5],[121,175,4.8],[104,181,1.5]]
];
function eggStroke(t0, t1, wOff) {
  const cx = 92, cy = 127, rx = 26, ry = 40, rot = 7 * Math.PI / 180, pts = [], N = 16;
  for (let k = 0; k <= N; k++) {
    const t = t0 + (t1 - t0) * k / N;
    const wob = 1 + 0.035 * Math.sin(3 * t + 1) + 0.025 * Math.sin(5 * t + 2);
    const x = rx * Math.cos(t) * (1 - 0.06 * Math.sin(t)) * wob, y = ry * Math.sin(t) * wob;
    const xr = x * Math.cos(rot) - y * Math.sin(rot), yr = x * Math.sin(rot) + y * Math.cos(rot);
    const taper = Math.min(1, k / 2.5, (N - k) / 2.5);
    pts.push([cx + xr, cy + yr, (3.2 + 2 * Math.sin(t * 1.6 + wOff)) * (0.25 + 0.75 * taper)]);
  }
  return brush(pts, 4);
}
const SCALES = [[84,104,14,6,-6,1.0],[101,110,15,7,8,0.9],[77,127,13,6,-10,1.1],[96,131,16,7,4,1.0],[106,150,12,5,10,0.85],[85,151,11,6,-3,0.95]];
function halfOval([x, y, w, d, tilt, k]) {
  const r = tilt * Math.PI / 180;
  const raw = [[-w / 2, -d * 0.1, 1.1 * k], [-w * 0.42, d * 0.55, 2.4 * k], [-w * 0.08, d, 3.2 * k], [w * 0.3, d * 0.8, 2.8 * k], [w / 2, d * 0.05, 1.3 * k]];
  return brush(raw.map(([px, py, pw]) => [x + px * Math.cos(r) - py * Math.sin(r), y + px * Math.sin(r) + py * Math.cos(r), pw]), 6);
}

const INK = { black: '#1e1a17', brown: '#6b4428', red: '#9a2c1f' };

// Rough, inky edges (each id is prefixed so two marks on one page do not clash).
function filters(p) {
  const one = (id, seed1, base, scale, seed2, fine) => `<filter id="${p}-${id}" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency="${base}" numOctaves="2" seed="${seed1}" result="w"/>
<feDisplacementMap in="SourceGraphic" in2="w" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="${fine}" numOctaves="2" seed="${seed2}" result="g"/>
<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.75" result="m"/>
<feComposite in="rough" in2="m" operator="in"/></filter>`;
  return `<defs>${one('black', 3, 0.045, 2.8, 21, 0.75)}${one('brown', 8, 0.05, 2.4, 44, 0.7)}${one('red', 5, 0.05, 2.4, 63, 0.8)}</defs>`;
}

const drawing = p => `<g filter="url(#${p}-red)" fill="${INK.red}">${FLAME_EDGES.map(e => brush(e)).join('')}</g>
<g filter="url(#${p}-brown)" fill="${INK.brown}">${eggStroke(-1.9, 1.95, 0.4)}${eggStroke(1.75, 4.5, 2.1)}${SCALES.map(halfOval).join('')}${brush([[93,164,5.5],[94,172,4.6],[96,180,3.8],[99,187,2.6]])}</g>`;

const FONT = "'Alfa Slab One', Georgia, serif";

// The drawing alone (favicon, small places). viewBox fits the flame.
function symbol({ id = 'fs', title = 'Fire and Seed' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 2 158 192" role="img" aria-label="${title}">${filters(id)}${drawing(id)}</svg>`;
}

// Stacked lockup: drawing at the left, FIRE / & / SEED at the right (the front patch layout).
function lockup({ id = 'fsl', title = 'Fire and Seed' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 2 330 192" role="img" aria-label="${title}">${filters(id)}
<g transform="translate(-6 0)">${drawing(id)}</g>
<g filter="url(#${id}-black)" fill="${INK.black}" font-family="${FONT}">
<text x="196" y="86" font-size="62" textLength="140" lengthAdjust="spacingAndGlyphs">FIRE</text>
<text x="266" y="120" font-size="26" text-anchor="middle">&amp;</text>
<text x="196" y="180" font-size="62" textLength="140" lengthAdjust="spacingAndGlyphs">SEED</text></g></svg>`;
}

// One-line lockup for the header: small drawing, then "FIRE & SEED".
function line({ id = 'fsh', title = 'Fire and Seed, home' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 2 560 192" role="img" aria-label="${title}">${filters(id)}${drawing(id)}
<g filter="url(#${id}-black)" fill="${INK.black}" font-family="${FONT}">
<text x="196" y="150" font-size="96" textLength="380" lengthAdjust="spacingAndGlyphs">FIRE &amp; SEED</text></g></svg>`;
}

module.exports = { symbol, lockup, line, INK };
