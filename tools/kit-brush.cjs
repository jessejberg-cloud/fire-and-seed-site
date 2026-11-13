// Generates the painted brushstroke behind buttons, the keyboard-focus stroke and the upright ink line.
// Run: node tools/kit-brush.cjs → prints the custom properties for identity.css (the colours are the site's, so
// they live in identity.css).
//
// The button stroke (design standard, Addendum C; Jesse's review of batch 1, Nov 10: "the lifted-brush tail is
// wanted"). One end is rounded and loaded with paint; the other tapers into a dry tail with a few bristle points,
// like a brush lifting off paper. Colour density and saturation vary along and across it.
//
// It is two pictures, laid side by side by the kit (.btn in kit/standard.css):
//   the body      stretched to the button's width less the tail: the rounded, loaded start, soft wavy edges, a
//                 lighter and a darker inner band, faint bristle streaks;
//   the lift-off  a fixed size at the right end (--brush-tail wide): the stroke narrows and breaks into five
//                 bristle clumps of different lengths with thin dry gaps running back between them.
// Two pictures, because one picture stretched with the button squeezed the tail into stubby teeth on a short
// button and pulled it into needles on a long one. At a fixed size the bristles keep their shape on every button,
// and the label, which the button's right padding keeps left of the tail, always sits on solid paint.
// The label must have at least 4.5:1 against every pixel of paint behind it: the lighter band and the light
// streaks therefore stop where the stroke itself is still dark (its first 60%).
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
// a closed wavy shape from x0 to x1 with rounded ends: the inner bands of the stroke
function band(r, x0, x1, top, bot, n = 24) {
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + (x1 - x0) * i / n);
  const wave = (base, amp, ph) => xs.map((x, i) => base + Math.sin(i / n * Math.PI * 1.6 + ph) * amp + (r() - 0.5) * amp * 0.6);
  const t = wave(top, 1.6, r() * 3), b = wave(bot, 1.4, r() * 3);
  const mid = (top + bot) / 2, rad = (bot - top) / 2;
  let d = `M${P(x0 + 2, mid)} Q${P(x0 - 1, top + 2)} ${P(xs[1], t[1])}`;
  for (let i = 2; i < n; i++) d += ` L${P(xs[i], t[i])}`;
  d += ` Q${P(x1 + rad * 0.5, top + 1)} ${P(x1 + 1, mid)} Q${P(x1 + rad * 0.4, bot)} ${P(xs[n - 1], b[n - 1])}`;
  for (let i = n - 2; i >= 1; i--) d += ` L${P(xs[i], b[i])}`;
  return d + ` Q${P(x0 - 1, bot - 2)} ${P(x0 + 2, mid)} Z`;
}
const TOP = 5, BOT = 59, H = 64;          // the stroke's edges, shared by the body and the lift-off so they meet exactly
// The body: rounded and loaded at the left, wavy edges that settle to TOP and BOT at the right end, where it is cut
// straight, because the lift-off picture carries on from there.
function bodyShape(r, W, n = 22) {
  const xs = Array.from({ length: n + 1 }, (_, i) => 3 + (W - 3) * i / n);
  const settle = i => Math.min(1, (n - i) / 4);
  const ph = [r() * 3, r() * 3];
  const t = xs.map((_, i) => TOP + (Math.sin(i / n * Math.PI * 1.6 + ph[0]) * 1.6 + (r() - 0.5) * 0.96) * settle(i));
  const b = xs.map((_, i) => BOT + (Math.sin(i / n * Math.PI * 1.6 + ph[1]) * 1.4 + (r() - 0.5) * 0.84) * settle(i));
  const mid = (TOP + BOT) / 2;
  let d = `M${P(5, mid)} Q${P(2, TOP + 2)} ${P(xs[1], t[1])}`;
  for (let i = 2; i <= n; i++) d += ` L${P(xs[i], t[i])}`;
  for (let i = n; i >= 1; i--) d += ` L${P(xs[i], b[i])}`;
  return d + ` Q${P(2, BOT - 2)} ${P(5, mid)} Z`;
}
// The lift-off: the brush leaves the paper. The paint runs dry and the bristles part: thin dry gaps open inside the
// stroke and run with it, so its end is five streaks lying side by side, not five teeth. The outer streaks lift
// first and stay short, so the whole end narrows; the inner ones drag on, one of them nearly to the edge. Each streak
// ends in a short point, and the longer ones carry a hairline dry streak of their own.
// Not needles on a full-height end, and not a saw edge: the gaps are thin and start well inside the stroke.
function liftOff(q, W = 44) {
  const j = v => (q() - 0.5) * v;
  const cut = [TOP, 16.8 + j(1.6), 27.2 + j(1.6), 36.6 + j(1.6), 47.6 + j(1.6), BOT];      // where one streak ends and the next begins
  const fan = [0, 1.6, 0.5, -0.6, -1.7, 0];                                               // the streaks close in a little as they go
  const reach = [0.6, 0.93, 0.74, 0.985, 0.52].map(v => W * Math.min(0.985, v + j(0.05)));  // how far each streak runs
  const start = [0.2, 0.08, 0.27, 0.14].map(v => W * (v + j(0.03)));                        // where each dry gap opens, inside the stroke
  const wide = [1.25, 1.05, 1.4, 1.15].map(v => v + j(0.3));                                // half the width each gap grows to
  // the line between streak k-1 and streak k at x, and half the dry gap along it (nothing before the gap opens)
  const seam = (k, x) => cut[k] + fan[k] * x / W + Math.sin(x / W * 5 + k * 1.7) * 0.35;
  const half = (k, x) => { const g = k - 1; if (g < 0 || g > 3 || x <= start[g]) return 0; const run = Math.min(reach[g], reach[g + 1]) - start[g]; return wide[g] * Math.pow(Math.min(1, (x - start[g]) / run), 0.7); };
  // a streak's upper and lower edge at x: its seams, moved apart by the gaps; the outermost edges curve inward
  const upper = (k, x) => k === 0 ? TOP + 3.2 * Math.pow(x / reach[0], 2.2) : seam(k, x) + half(k, x);
  const lower = (k, x) => k === 4 ? BOT - 3.6 * Math.pow(x / reach[4], 2.2) : seam(k + 1, x) - half(k + 1, x);
  let d = `M${P(0, TOP)}`, holes = '';
  const tips = [];
  for (let k = 0; k < 5; k++) {
    const x0 = k === 0 ? 0 : start[k - 1], x2 = k === 4 ? 0 : start[k];                   // where its edges leave the solid paint
    const len = reach[k] - Math.max(x0, x2), tl = Math.max(6, len * 0.46), xs = reach[k] - tl;   // the last stretch thins steadily to the point
    const yu = upper(k, xs), yl = lower(k, xs), tip = [reach[k], (yu + yl) / 2 + (2 - k) * 0.5 + j(1)];
    const N = 6;
    for (let i = 1; i <= N; i++) { const x = x0 + (xs - x0) * i / N; d += ` L${P(x, upper(k, x))}`; }
    d += ` C${P(xs + tl * 0.38, yu + (tip[1] - yu) * 0.3)} ${P(reach[k] - tl * 0.3, tip[1] - 0.4)} ${P(tip[0], tip[1])}`;
    d += ` C${P(reach[k] - tl * 0.3, tip[1] + 0.4)} ${P(xs + tl * 0.38, yl + (tip[1] - yl) * 0.3)} ${P(xs, yl)}`;
    for (let i = N - 1; i >= 0; i--) { const x = x2 + (xs - x2) * i / N; d += ` L${P(x, lower(k, x))}`; }
    tips.push(tip);
    if (len > 22) {   // a hairline dry streak inside a long streak
      const a = Math.max(x0, x2) + len * (0.18 + q() * 0.1), b = reach[k] - tl * (0.9 + q() * 0.5), m = (a + b) / 2;
      const mid = x => (upper(k, x) + lower(k, x)) / 2 + j(0.6);
      holes += ` M${P(a, mid(a))} Q${P(m, mid(m) - 0.55)} ${P(b, mid(b))} Q${P(m, mid(m) + 0.55)} ${P(a, mid(a))} Z`;
    }
  }
  return { shape: d + ' Z' + holes, tips };
}
// One stroke: [c0, c1, c2] run from the loaded start to the finish, `light` and `dark` are the inner tones, `tip`
// is the thinned paint at the very ends of the bristles. Returns the two pictures as one value for a custom
// property: the lift-off first (it lies on top), then the body.
function brush(seed, [c0, c1, c2], light, dark, tip = c2) {
  const r = rng(seed), q = rng(seed * 31 + 5), W = 216;
  const url = svg => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
  const line = (x0, x1, y, col, w) => `<path d='M${x0.toFixed(0)} ${y.toFixed(1)} C ${(x0 + (x1 - x0) * 0.33).toFixed(0)} ${(y + (r() - 0.5) * 2).toFixed(1)}, ${(x0 + (x1 - x0) * 0.66).toFixed(0)} ${(y + (r() - 0.5) * 2).toFixed(1)}, ${x1.toFixed(0)} ${(y + (r() - 0.5) * 2).toFixed(1)}' stroke='${col}' stroke-width='${w.toFixed(1)}' fill='none' opacity='0.4' stroke-linecap='round'/>`;
  // bristle streaks: dark ones run nearly the whole stroke; the one light streak lies in the darker band and stops
  // while the paint is still dark (a light streak across the lighter band took the label under 4.5:1)
  const streaks = Array.from({ length: 5 }, (_, i) => {
    const y = 15 + i * 8 + (r() - 0.5) * 2, x0 = 26 + r() * 26;
    return i === 3 ? line(x0, W * (0.46 + r() * 0.12), y, light, 0.6 + r() * 0.6) : line(x0, W * (0.84 + r() * 0.12), y, dark, 0.6 + r() * 0.6);
  }).join('');
  const body = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'>`
    + `<defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='${c0}'/><stop offset='0.35' stop-color='${c1}'/><stop offset='0.6' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient>`
    + `<linearGradient id='l' x1='0' x2='1'><stop offset='0' stop-color='${dark}' stop-opacity='0.34'/><stop offset='0.45' stop-color='${dark}' stop-opacity='0.14'/><stop offset='1' stop-color='${dark}' stop-opacity='0'/></linearGradient>`
    + `<linearGradient id='h' x1='0' x2='1'><stop offset='0' stop-color='${light}' stop-opacity='0.35'/><stop offset='0.45' stop-color='${light}' stop-opacity='0.3'/><stop offset='1' stop-color='${light}' stop-opacity='0'/></linearGradient></defs>`
    + `<path d='${bodyShape(r, W)}' fill='url(#g)'/>`
    + `<path d='${band(q, 5, 78, 9, 55, 8)}' fill='url(#l)'/>`                           // the loaded start: the paint is thickest here
    + `<path d='${band(r, 10, W * 0.72, 14, 26, 14)}' fill='url(#h)'/>`                 // a lighter band that fades out while the paint is still dark
    + `<path d='${band(r, 12, W * 0.93, 37, 48, 16)}' fill='${dark}' opacity='0.3'/>`     // a darker band, nearly to the end
    + streaks + `</svg>`;
  const lift = liftOff(q);
  const hair = lift.tips.filter((_, j) => j !== 2).map(([x, y], j) => `<path d='M0 ${(y - (j - 1.5) * 1.6).toFixed(1)} Q${(x * 0.5).toFixed(1)} ${(y - (j - 1.5) * 0.9).toFixed(1)} ${(x - 3).toFixed(1)} ${y.toFixed(1)}' stroke='${dark}' stroke-width='0.8' fill='none' opacity='0.3' stroke-linecap='round'/>`).join('');
  const tail = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 ${H}' preserveAspectRatio='none'>`
    + `<defs><linearGradient id='t' x1='0' x2='1'><stop offset='0' stop-color='${c2}'/><stop offset='0.3' stop-color='${c2}'/><stop offset='1' stop-color='${tip}'/></linearGradient>`
    + `<clipPath id='c'><path d='${lift.shape}' clip-rule='evenodd'/></clipPath></defs>`
    + `<path d='${lift.shape}' fill='url(#t)' fill-rule='evenodd'/><g clip-path='url(#c)'>${hair}</g></svg>`;
  return `${url(tail)}, ${url(body)}`;
}
// The keyboard-focus mark (Jesse, Nov 10: no box, ring or pill around the focused item). One pass of a brush pen
// under the item: it lands heavy, thins as it travels, drifts a little and lifts off in a blunt point.
// It is stretched to the item's width, so it is drawn long and low.
function stroke(seed, color) {
  const r = rng(seed), W = 300, H = 10, n = 30;
  const p = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const xs = Array.from({ length: n + 1 }, (_, i) => 4 + (W - 14) * i / n);
  const mid = xs.map((_, i) => 5 + Math.sin(i / n * Math.PI * 1.3 + 0.6) * 0.45);
  const half = xs.map((_, i) => (3.9 - 1.7 * i / n) * (0.95 + r() * 0.1));
  const t = mid.map((m, i) => m - half[i] * 0.92), b = mid.map((m, i) => m + half[i]);
  let d = `M${p(xs[0] - 1.5, mid[0])} Q${p(xs[0] - 2.5, t[0] + 0.4)} ${p(xs[1], t[1])}`;
  for (let i = 2; i <= n; i++) d += ` L${p(xs[i], t[i])}`;
  d += ` Q${p(xs[n] + 5, mid[n] - 0.9)} ${p(xs[n] + 8, mid[n] + 0.2)} Q${p(xs[n] + 4, mid[n] + 1.3)} ${p(xs[n], b[n])}`;
  for (let i = n - 1; i >= 1; i--) d += ` L${p(xs[i], b[i])}`;
  d += ` Q${p(xs[0] - 2.5, b[0] - 0.4)} ${p(xs[0] - 1.5, mid[0])} Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
}
// The upright ink line (Jesse's review of batch 1, Nov 10: no straight quote bars; a hand-drawn line is allowed as an
// occasional accent). One pass of a brush pen drawn downward: it lands heavy, wanders a little, thins as it travels
// and lifts off to a point with a slight flick. It is stretched to the height of the words beside it.
function upright(seed, color) {
  const r = rng(seed), W = 12, H = 200, n = 26;
  const p = (x, y) => `${x.toFixed(2)} ${y.toFixed(1)}`;
  const ts = Array.from({ length: n + 1 }, (_, i) => i / n);
  const cx = ts.map(t => 5.6 + 1.25 * Math.sin(t * Math.PI * 1.75 + 0.5) + 0.35 * Math.sin(t * Math.PI * 4.6 + 1.9) + (r() - 0.5) * 0.3 + (t > 0.93 ? (t - 0.93) * 16 : 0));
  const hw = ts.map(t => (t < 0.05 ? 1.5 + t * 14 : 2.2 - 1.2 * Math.min(1, (t - 0.05) / 0.8) + 0.3 * Math.exp(-Math.pow((t - 0.56) / 0.09, 2))) * (0.93 + r() * 0.14) * (t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.1) : 1));
  const y = ts.map(t => 3 + t * (H - 6));
  let d = `M${p(cx[0] - hw[0], y[0] + 1.5)} Q${p(cx[0] - hw[0] * 0.6, y[0] - 2)} ${p(cx[0], y[0] - 2)} Q${p(cx[0] + hw[0] * 0.9, y[0] - 2)} ${p(cx[0] + hw[0], y[0] + 1.5)}`;
  for (let i = 1; i <= n; i++) d += ` L${p(cx[i] + hw[i], y[i])}`;
  for (let i = n - 1; i >= 1; i--) d += ` L${p(cx[i] - hw[i], y[i])}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'><path d='${d} Z' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
}
// The link underline (Jesse's batch 3a review, Nov 10: "in between the old and current versions, more hand-drawn
// (slight wobble, uneven weight), still muted"). A fine pen line, not a brush: it drifts gently up and down, swells
// and thins along its length and tapers at both ends. Drawn long and low, it is stretched to the link's width.
function under(seed, color, opacity = 1) {
  const r = rng(seed), W = 300, H = 8, n = 48;
  const p = (x, y) => `${x.toFixed(1)} ${y.toFixed(2)}`;
  const ph = [r() * 6, r() * 6, r() * 6];
  const ts = Array.from({ length: n + 1 }, (_, i) => i / n);
  const xs = ts.map(t => 1.5 + t * (W - 3));
  const mid = ts.map(t => 4 + 0.75 * Math.sin(t * Math.PI * 2.2 + ph[0]) + 0.3 * Math.sin(t * Math.PI * 6.8 + ph[1]) + (r() - 0.5) * 0.25);
  const taper = t => Math.min(1, t / 0.035, (1 - t) / 0.05);
  const hw = ts.map(t => (0.95 + 0.4 * Math.sin(t * Math.PI * 1.7 + ph[2]) + (r() - 0.5) * 0.18) * (0.35 + 0.65 * taper(t)));
  let d = `M${p(xs[0], mid[0] - hw[0])}`;
  for (let i = 1; i <= n; i++) d += ` L${p(xs[i], mid[i] - hw[i])}`;
  for (let i = n; i >= 0; i--) d += ` L${p(xs[i], mid[i] + hw[i])}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'><path d='${d} Z' fill='${color}'${opacity < 1 ? ` fill-opacity='${opacity}'` : ''}/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
}
// Choices and the select arrow (Jesse, batch 3a review, Nov 10: "Restyle as hand-drawn ink: an ink ring, a teal ink
// dot when chosen, matching the field underlines"). The ring and the box are drawn in the field underline's ink, one
// pen pass that swells and thins and overlaps a little where it closes; the dot and the tick are teal ink.
function enc(svg) { return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`; }
function ring(seed, ink) {   // an ink ring: a closed band whose radius and weight wander, with a small overlap
  const r = rng(seed), n = 40, c = 12, P2 = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const a0 = -2.1, span = Math.PI * 2 * 1.06;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, a = a0 + span * t;
    const rad = 9.1 + 0.45 * Math.sin(t * Math.PI * 2 * 1.5 + 0.7) + (r() - 0.5) * 0.25;
    const w = (0.85 + 0.35 * Math.sin(t * Math.PI * 2 + 1.3)) * Math.min(1, t / 0.06, (1 - t) / 0.08 + 0.25);
    return [a, rad, w];
  });
  const out = pts.map(([a, rad, w]) => P2(c + Math.cos(a) * (rad + w), c + Math.sin(a) * (rad + w)));
  const inn = pts.map(([a, rad, w]) => P2(c + Math.cos(a) * (rad - w), c + Math.sin(a) * (rad - w))).reverse();
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M${out.join(' L')} L${inn.join(' L')} Z' fill='${ink}'/></svg>`);
}
function blob(seed, color, rad = 4.9) {   // a teal ink dot: a slightly uneven drop
  const r = rng(seed), n = 18, c = 12;
  const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, q = rad * (0.93 + r() * 0.14) * (1 + 0.05 * Math.sin(a * 2 + 0.4)); return `${(c + Math.cos(a) * q).toFixed(2)} ${(c + Math.sin(a) * q).toFixed(2)}`; });
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M${pts.join(' L')} Z' fill='${color}'/></svg>`);
}
function box(seed, ink) {   // an ink box: four pen strokes, square corners, edges that drift a little
  const r = rng(seed), side = (x0, y0, x1, y1, k) => {   // one stroke as a thin quadrilateral band
    const n = 10, P2 = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`, top = [], bot = [];
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) { const t = i / n, off = 0.35 * Math.sin(t * Math.PI + k) + (r() - 0.5) * 0.2, w = 0.8 + 0.3 * Math.sin(t * Math.PI * 1.3 + k);
      const x = x0 + dx * t + nx * off, y = y0 + dy * t + ny * off; top.push(P2(x + nx * w, y + ny * w)); bot.push(P2(x - nx * w, y - ny * w)); }
    return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
  };
  const d = [side(3.2, 3.6, 20.9, 3.1, 0.3), side(20.6, 2.6, 21.1, 20.9, 1.1), side(21.3, 20.6, 3.0, 21.0, 2.0), side(3.5, 21.4, 3.0, 3.0, 2.6)].join(' ');
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${d}' fill='${ink}'/></svg>`);
}
function tick(color) {   // a teal ink tick: loaded at the start, thinning as it rises
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M5.6 12.4 C6.6 11.6 7.6 11.9 8.4 12.9 L10.6 15.6 C12.9 11.6 15.4 8.3 18.9 5.2 C19.4 4.8 19.9 5.3 19.5 5.8 C16.3 9.4 13.9 13.1 11.6 17.9 C11.2 18.8 10.2 18.9 9.6 18.1 L5.4 13.6 C5.1 13.2 5.2 12.7 5.6 12.4 Z' fill='${color}'/></svg>`);
}
function chevron(ink) {   // the select arrow: one pen stroke, heavier where it turns
  return enc(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 10'><path d='M1.1 2.4 C1 1.8 1.6 1.5 2 1.9 C3.6 3.6 5.2 5.6 7.1 7.2 C8.8 5.4 10.3 3.6 12.1 1.6 C12.5 1.2 13.1 1.5 12.9 2.1 C11.4 4.5 9.6 6.6 7.8 8.6 C7.4 9.1 6.8 9.1 6.4 8.7 C4.4 6.8 2.7 4.7 1.1 2.4 Z' fill='${ink}'/></svg>`);
}
const SITES = {
  // DT: teal. Lightest part of the primary (#387570) keeps cream text at 4.8:1; quiet wash keeps dark teal text at 4.8:1.
  dt: {
    // [seed, [loaded start, middle, finish], lighter inner tone, darker inner tone, thinned paint at the bristle tips]
    primary: [42, ['#1f4f4b', '#2e6863', '#387570'], '#4a8a83', '#173d3a', '#4a8a83'],
    primaryHover: [42, ['#163b38', '#1f4f4b', '#2a5f5a'], '#356f69', '#0f2b29', '#356f69'],
    quiet: [16, ['#9fc2b8', '#b9d3cb', '#d6e6e0'], '#e3eeea', '#8fb5aa', '#d6e6e0'],
    // pointer over the quiet button: the wash fills in toward its light end. Its start stays as light as at rest,
    // because the dark teal label needs 4.5:1 there too (a darker start measured 4.0:1)
    quietHover: [16, ['#9dc2b7', '#a8cabf', '#bcd7ce'], '#cfe2dc', '#93b9ad', '#bcd7ce'],
  },
};
const FOCUS = { dt: { ink: '#1f1b17', deep: '#eabb4f' } };   // --c-focus and --c-deep-accent
const LINE = { dt: '#76862f' };
// the link underline: --c-line (teal at 42%) at rest, --c-action-hover under the pointer; on the footer, cream at 45%
// and the footer's mustard
const UNDER = { dt: { rest: ['#2e6863', 0.42], hover: ['#1f4f4b', 1], deep: ['#f7f4ed', 0.45], deepHover: ['#eabb4f', 1] } };                              // the olive of the ink lines (brushes.css)
if (require.main === module) {
  const s = SITES[process.argv[2] || 'dt'];
  for (const [k, [seed, stops, light, dark, tip]] of Object.entries(s))
    console.log(`  --brush-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${brush(seed, stops, light, dark, tip)};`);
  // the focus mark: the ink colour on light grounds, the footer's mustard on the deep ground
  const f = FOCUS[process.argv[2] || 'dt'];
  console.log(`  --focus-ink: ${stroke(7, f.ink)};`);
  console.log(`  --focus-ink-deep: ${stroke(7, f.deep)};`);
  console.log(`  --rule-ink-v: ${upright(11, LINE[process.argv[2] || 'dt'])};`);
  const u = UNDER[process.argv[2] || 'dt'];
  // choices and the select arrow: the field underline's ink (full strength: 3:1 or more on the field), teal for chosen
  console.log(`  --mark-ring: ${ring(5, '#8a7a62')};`);
  console.log(`  --mark-box: ${box(9, '#8a7a62')};`);
  console.log(`  --mark-dot: ${blob(13, '#2e6863')};`);
  console.log(`  --mark-tick: ${tick('#2e6863')};`);
  console.log(`  --mark-chevron: ${chevron('#8a7a62')};`);
  for (const [k, [c, o]] of Object.entries(u)) console.log(`  --ink-under${k === 'rest' ? '' : '-' + k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${under(23, c, o)};`);
}
module.exports = { brush, stroke, upright, under, ring, blob, box, tick, chevron };
