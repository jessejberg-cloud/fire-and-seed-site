# Fire & Seed stoneware textures (Jesse, Nov 13 2026: stoneware; every accent stamped or fire-burned).
# Draws the glaze and clay grounds and the glaze's edge from noise, never from geometry:
#   python3 tools/fs-glaze.py   -> site-src/assets/glaze/*.webp|png
# Edges are masks only (no drawn line along them). The button stamp is a stand-in until Jesse's own stamp prints
# are photographed and traced (DECISIONS.md, Nov 13).
import numpy as np, sys, os
from PIL import Image, ImageFilter
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site-src', 'assets', 'glaze'); os.makedirs(OUT, exist_ok=True)
PH = '/home/user/fire-and-seed-site/site-src/assets/photos/'

def fnoise(h, w, beta, seed, aniso=(1, 1)):
    """Tileable fractal noise from filtered white noise, 0..1."""
    r = np.random.default_rng(seed)
    f = np.fft.fft2(r.standard_normal((h, w)))
    fy = np.fft.fftfreq(h)[:, None] * aniso[0]; fx = np.fft.fftfreq(w)[None, :] * aniso[1]
    k = np.sqrt(fx ** 2 + fy ** 2); k[0, 0] = 1
    n = np.real(np.fft.ifft2(f / k ** beta))
    return (n - n.min()) / (n.max() - n.min())

def n1(n, beta, seed):
    r = np.random.default_rng(seed); f = np.fft.fft(r.standard_normal(n))
    k = np.abs(np.fft.fftfreq(n)); k[0] = 1
    v = np.real(np.fft.ifft(f / k ** beta)); return (v - v.mean()) / (np.abs(v).max())

def rgba(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')

def hexc(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# ------------------------------------------------------------ grounds
def speckle_ground(path, base, seed, size=512, spec=0.0016, cloud=8):
    n = fnoise(size, size, 1.6, seed); c = hexc(base)[None, None, :] + (n[..., None] - .5) * cloud
    r = np.random.default_rng(seed + 1); s = r.random((size, size)) < spec
    sm = np.array(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))) / 255.0
    c = c * (1 - sm[..., None] * 1.6) + hexc('#5a4634') * sm[..., None] * 1.6
    a = np.full((size, size, 1), 255.0); rgba(np.concatenate([c, a], 2)).save(path)

# ------------------------------------------------------------ stoneware band body: glaze pooling, iron speckle
def glaze_body(path, seed, size=640):
    pool = fnoise(size, size, 2.0, seed); fine = fnoise(size, size, 1.0, seed + 3)
    c = hexc('#cbc3b2')[None, None] * (1 - (pool[..., None] - .5) * 0.07) + (fine[..., None] - .5) * 6
    c += (smoothstep(.6, .9, pool)[..., None]) * (hexc('#c4c7bd') - hexc('#cbc3b2')) * 0.5   # cooler pools
    r = np.random.default_rng(seed); s = r.random((size, size)) < 0.0012
    sm = np.array(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
    c = c * (1 - sm[..., None] * 1.5) + hexc('#6b4f3a') * sm[..., None] * 1.5
    rgba(np.concatenate([c, np.full((size, size, 1), 255.0)], 2)).save(path)

def mend(draw_w, draw_h, start, ang, length, seed, scale):
    """A crack: a wandering walk with a width that swells and pinches; returns list of (x, y, w)."""
    r = np.random.default_rng(seed); pts = []; x, y = start; a = ang; dw = n1(400, 1.2, seed)
    for i in range(int(length)):
        a += r.normal(0, .09) + (.05 if r.random() < .03 else 0) * r.choice([-6, 6]) + (ang - a) * .12
        x += np.cos(a) * scale; y += np.sin(a) * scale
        w = (2.0 + 1.2 * dw[i % 400] + r.normal(0, .25)) * scale * .6
        pts.append((x, y, max(.5 * scale, w)))
    return pts

def paint_mend(canvas, pts, ss):
    """Silver mend into an RGBA float canvas (supersampled): dark edge, metal body, a light catch line."""
    from PIL import ImageDraw
    H, W = canvas.shape[:2]
    for col, grow, off in [('#6f7477', 1.6, 0), ('#a9afb3', 1.0, 0), ('#e2e6e8', .35, -.35)]:
        m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
        for (x0, y0, w0), (x1, y1, w1) in zip(pts, pts[1:]):
            w = max(1, int((w0 + w1) / 2 * grow)); d.line([(x0, y0 + off * w), (x1, y1 + off * w)], fill=255, width=w)
            d.ellipse([x1 - w / 2, y1 - w / 2 + off * w, x1 + w / 2, y1 + w / 2 + off * w], fill=255)
        a = np.array(m.filter(ImageFilter.GaussianBlur(ss * .35)))[..., None] / 255.0
        canvas[..., :3] = canvas[..., :3] * (1 - a) + hexc(col) * a
        canvas[..., 3:] = np.maximum(canvas[..., 3:], a * 255)

def glaze_edge(path, seed, W=1600, H=56, ss=2, drips=True, cracks=1):
    """Top edge of a glazed band: the glaze ends in a soft wandering line; where it thins, the clay shows toasty;
    a few drips hang below on bottom edges (turned over in CSS)."""
    w, h = W * ss, H * ss
    line = 30 * ss + n1(w, 1.8, seed) * 18 * ss + n1(w, 1.0, seed + 1) * 2.5 * ss
    yy = np.arange(h)[:, None]; d = yy - line[None, :]            # >0 inside the glaze
    rimw = (7 + 4 * n1(w, 1.4, seed + 2)) * ss
    body = fnoise(h, w, 1.4, seed + 5)
    alpha = smoothstep(-1.2 * ss, .8 * ss, d + (body - .5) * 1.5 * ss)
    clay = smoothstep(rimw[None, :], 0, d) * smoothstep(-1 * ss, 1.5 * ss, d)   # 1 at the edge, fading inward
    glaze = hexc('#cbc3b2'); toast = hexc('#b8916c'); thin = hexc('#e6dccb')
    c = glaze[None, None] + (thin - glaze) * (clay ** .6)[..., None] * .8
    c = c + (toast - c) * (clay ** 1.6)[..., None] * .9
    lip = np.exp(-((d - rimw[None, :] * 1.1) / (2.2 * ss)) ** 2)   # the glaze rolls up thicker just inside its edge
    c = c - lip[..., None] * 14
    c += (body[..., None] - .5) * 8
    msk = np.zeros((h, w, 4)); msk[..., 3] = alpha * 255
    rgba(msk).resize((W, H), Image.LANCZOS).save(path.replace('.png', '-mask.png'))
    canvas = np.concatenate([c, (alpha * np.clip(clay * 1.3 + lip * .6, 0, 1) * 255)[..., None]], 2)
    r = np.random.default_rng(seed)
    for k in range(cracks):
        x0 = r.uniform(.3, .6) * w
        pts = mend(w, h, (x0, line[int(x0)] + 1 * ss), np.pi / 2 + r.normal(0, .4), 70, seed + 10 + k, 2.2 * ss)
        paint_mend(canvas, pts, ss)
    im = rgba(canvas).resize((W, H), Image.LANCZOS); im.save(path)

def mend_stroke(path, seed, W=420, H=28, ss=3):
    """A silver kintsugi seam used as a heading underline: a crack that wanders, swells and pinches."""
    canvas = np.zeros((H * ss, W * ss, 4))
    pts = mend(W * ss, H * ss, (4 * ss, H * ss * .5), 0.0, W * ss / (1.6 * ss) - 6, seed, 1.6 * ss)
    paint_mend(canvas, pts, ss)
    rgba(canvas).resize((W, H), Image.LANCZOS).save(path)

# ------------------------------------------------------------ wood
def grain_field(h, w, seed, lines=26, warp=0.10):
    """Flat-sawn grain: growth lines bent by slow noise, with fine pores."""
    big = fnoise(h, w, 2.6, seed, aniso=(1, 2.5)); fine = fnoise(h, w, 1.1, seed + 1, aniso=(1, 6))
    y = np.arange(h)[:, None] / h + (big - .5) * warp * 2
    ph = (y * lines) % 1.0
    late = smoothstep(.55, .78, ph) * (1 - smoothstep(.8, .98, ph))   # latewood band
    return late, fine, big

def wood_body(path, seed, W=1200, H=640):
    late, fine, big = grain_field(H, W, seed, 11, .16)
    base = hexc('#d9c6a8'); dark = hexc('#b89a72')
    c = base[None, None] + (dark - base) * (late * .55 + (fine - .5) * .25 + (big - .5) * .25)[..., None]
    rgba(np.concatenate([c, np.full((H, W, 1), 255.0)], 2)).save(path)

def live_edge(path, seed, W=1600, H=70, ss=2):
    """Top edge of a board: a live edge with a strip of bark (dark, rough, uneven) over pale sapwood."""
    w, h = W * ss, H * ss
    outer = 28 * ss + n1(w, 1.9, seed) * 22 * ss + n1(w, 1.1, seed + 1) * 4 * ss     # bark's ragged outside
    barkw = np.clip((12 + 12 * n1(w, 1.6, seed + 2)), 2, None) * ss
    sapw = (7 + 4 * n1(w, 1.6, seed + 3)) * ss
    yy = np.arange(h)[:, None]; d = yy - outer[None, :]
    tex = fnoise(h, w, 1.0, seed + 4, aniso=(3, 1))       # bark furrows run across
    alpha = smoothstep(-1 * ss, 1 * ss, d + (tex - .5) * 5 * ss)
    bark = 1 - smoothstep(barkw[None, :] - 1.5 * ss, barkw[None, :] + 1.5 * ss, d)
    sap = (1 - smoothstep(barkw[None, :] + sapw[None, :] - 3 * ss, barkw[None, :] + sapw[None, :] + 3 * ss, d)) * (1 - bark)
    late, fine, big = grain_field(h, w, seed + 7, 6, .16)
    heart = hexc('#d9c6a8')[None, None] + (hexc('#b89a72') - hexc('#d9c6a8')) * (late * .55 + (fine - .5) * .25)[..., None]
    sapc = hexc('#ece0c9'); barkc = hexc('#4a3626')[None, None] + (tex[..., None] - .5) * 60
    c = heart * (1 - sap[..., None]) + sapc * sap[..., None]
    c = c * (1 - bark[..., None]) + barkc * bark[..., None]
    msk = np.zeros((h, w, 4)); msk[..., 3] = alpha * 255
    rgba(msk).resize((W, H), Image.LANCZOS).save(path.replace('.png', '-mask.png'))
    rgba(np.concatenate([c, (alpha * np.clip(bark + sap * 1.2, 0, 1) * 255)[..., None]], 2)).resize((W, H), Image.LANCZOS).save(path)

# ------------------------------------------------------------ block print stamps: the block's grain shows in the ink
def stamp(mask, color, seed, ss, grain=0.5, voids=0.06):
    """Ink a shape mask (0..1 float, supersampled) like a hand-pressed woodblock: grain streaks, voids at the edge."""
    h, w = mask.shape
    late, fine, big = grain_field(h, w, seed, max(6, h // (8 * ss)), .25)
    press = fnoise(h, w, 1.8, seed + 2)              # uneven pressure
    speck = fnoise(h, w, .35, seed + 4)
    ink = 1 - late * grain * .5 - (fine - .5) * .5 - smoothstep(.62, 1.0, 1 - press) * .35 - smoothstep(.62, .8, speck) * .6
    # the shape's edge is eaten a little where pressure is light
    edge = np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2 * ss))) / 255.0
    ink = ink - (1 - edge) * .8 * (1 - press)
    r = np.random.default_rng(seed); v = r.random((h, w)) < voids * .02
    vm = np.array(Image.fromarray((v * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2 * ss))) / 255.0
    a = np.clip(mask * smoothstep(.25, .6, ink - vm * 3), 0, 1)
    c = np.broadcast_to(hexc(color), (h, w, 3)).copy() * (1 - (1 - press[..., None]) * .12)
    return np.concatenate([c, (a * 255)[..., None]], 2)

def blob_mask(h, w, seed, ss, kind):
    """Carved outlines: wandering, soft at the corners, never geometric."""
    yy, xx = np.mgrid[0:h, 0:w]
    if kind == 'button':   # a carved block, longer than tall, edges wander, soft corners
        e = n1(2 * (w + h), 1.5, seed) * 3.5 * ss
        top = 6 * ss + e[:w] + n1(w, .7, seed + 1) * .5 * ss
        bot = h - 6 * ss + e[w:2 * w][::-1]
        lft = 7 * ss + e[2 * w:2 * w + h]; rgt = w - 7 * ss + e[2 * w + h:2 * w + 2 * h]
        m = smoothstep(-ss, ss, yy - top[None, :]) * smoothstep(-ss, ss, bot[None, :] - yy)
        return eroded(h, w, seed, ss, 7 * ss, wander=3.2 * ss, rag=1.3 * ss, tilt=.6)
    if kind == 'gouge':    # a gouge line: tapered at both ends, wanders
        mid = h / 2 + n1(w, 1.8, seed) * h * .12
        t = np.linspace(0, 1, w); half = (np.sin(np.pi * t) ** .45) * h * .2 * (1 + n1(w, 1.2, seed + 1) * .35)
        return smoothstep(-ss, ss, half[None, :] - np.abs(yy - mid[None, :]))
    raise ValueError(kind)

def cone_mask(S, seed, ss):
    """A small sequoia cone: an egg with scale-cuts carved out (white lines), stem below."""
    from PIL import ImageDraw
    m = Image.new('L', (S, S), 0); d = ImageDraw.Draw(m); r = np.random.default_rng(seed)
    cx, cy, rx, ry = S * .5, S * .44, S * .27, S * .36
    pts = []
    for k in range(80):
        t = k / 80 * 2 * np.pi; wob = 1 + .04 * np.sin(3 * t + 1) + .03 * np.sin(5 * t)
        pts.append((cx + rx * wob * np.cos(t), cy + ry * wob * np.sin(t)))
    d.polygon(pts, fill=255)
    d.line([(cx, cy + ry * .95), (cx + S * .02, S * .95)], fill=255, width=int(S * .05))
    for row in range(4):                                   # carved scales: short arcs cut away
        y = cy - ry * .55 + row * ry * .38
        for col in range(-1, 2):
            x = cx + col * rx * .55 + (row % 2) * rx * .27 - rx * .13
            if abs(x - cx) > rx * .8: continue
            x += r.normal(0, S * .015); y += r.normal(0, S * .012); k = r.uniform(.8, 1.2)
            d.arc([x - S * .07 * k, y - S * .05 * k, x + S * .07 * k, y + S * .05 * k], 15 + r.uniform(0, 20), 150 + r.uniform(0, 25), fill=0, width=max(2, int(S * r.uniform(.016, .028))))
    a = np.array(m.filter(ImageFilter.GaussianBlur(ss * .6))) / 255.0
    return a

def make_stamp(path, kind, W, H, color, seed, ss=3, **kw):
    w, h = W * ss, H * ss
    m = cone_mask(w, seed, ss) if kind == 'cone' else blob_mask(h, w, seed, ss, kind)
    rgba(stamp(m, color, seed + 9, ss, **kw)).resize((W, H), Image.LANCZOS).save(path)

def eroded(h, w, seed, ss, inset, blur=0, rough=0, beta=0, wander=None, rag=None, tilt=None, ends=1.0, rag_ends=1.0, chips=True):
    """A hand-cut shape: each side wanders at three scales (a slow bow, a medium wave, a fine ragged edge),
    the corners meet where the sides cross (no radius), a few chips are bitten out, and the whole is tilted a little."""
    r = np.random.default_rng(seed)
    wander = inset * .45 if wander is None else wander
    rag = ss * 1.4 if rag is None else rag
    tilt = r.uniform(-1.1, 1.1) if tilt is None else tilt
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    t = np.radians(tilt); cx, cy = w / 2, h / 2
    X = (xx - cx) * np.cos(t) + (yy - cy) * np.sin(t) + cx
    Y = -(xx - cx) * np.sin(t) + (yy - cy) * np.cos(t) + cy
    def side(n, k):
        a = wander * (ends if k > 2 else 1)
        return inset + n1(n, 2.4, seed + k) * a + n1(n, 1.3, seed + k + 50) * a * .35
    xi = np.clip(X, 0, w - 1).astype(int); yi = np.clip(Y, 0, h - 1).astype(int)
    top, bot, lft, rgt = side(w, 1), side(w, 2), side(h, 3), side(h, 4)
    dist = np.minimum.reduce([Y - top[xi], (h - Y) - bot[xi], X - lft[yi], (w - X) - rgt[yi]])
    fine = (fnoise(h, w, .55, seed + 9) - .5) * 2 * rag
    if rag_ends != 1.0:
        nearlr = np.minimum(X, w - X) < np.minimum(Y, h - Y)
        fine = np.where(nearlr, fine * rag_ends, fine)
    for _ in range(r.integers(3, 6) if chips else 0):                    # chips
        px, py = r.uniform(0, w), r.uniform(0, h); rad = r.uniform(1.5, 4) * ss
        edge_d = dist[int(min(py, h - 1)), int(min(px, w - 1))]
        if abs(edge_d) < inset: dist -= np.clip(rad - np.hypot(X - px, Y - py), 0, None) * 1.2
    return smoothstep(-.7 * ss, .7 * ss, dist + fine)

# ------------------------------------------------------------ photos
def soft_shape(h, w, seed, ss, inset):
    """An irregular, soft-cornered outline for a photo or a tile (noise-bent edges, knife-cut corners)."""
    yy, xx = np.mgrid[0:h, 0:w]; e = lambda s, n: n1(n, 1.6, seed + s) * inset * .35
    top = inset + e(1, w); bot = h - inset + e(2, w); lft = inset + e(3, h); rgt = w - inset + e(4, h)
    m = smoothstep(-ss, ss, yy - top[None, :]) * smoothstep(-ss, ss, bot[None, :] - yy)
    m *= smoothstep(-ss, ss, xx - lft[:, None]) * smoothstep(-ss, ss, rgt[:, None] - xx)
    cut = inset * 1.6
    for (sx, sy) in [(0, 0), (w, 0), (0, h), (w, h)]:
        dd = np.abs(xx - sx) + np.abs(yy - sy)
        m *= smoothstep(-ss * 2, ss * 2, dd - cut - inset * (1 + .6 * np.random.default_rng(seed + sx + sy).random()))
    return m

def photo_piece(path, photo, kind, seed, S=460, ss=2):
    s = S * ss; pic = Image.open(PH + photo).convert('RGBA')
    crop = pic.crop((70, 70, 350, 350)).resize((int(s * .72), int(s * .72)), Image.LANCZOS)
    p = np.array(crop).astype(float); ph, pw = p.shape[:2]
    p[..., :3] = p[..., :3] * .93 + p[..., :3].mean(2, keepdims=True) * .07      # slightly muted
    canvas = np.zeros((s, s, 4))
    if kind == 'tile':      # a glazed clay tile, the photo pressed into its middle, one silver mend
        tm = eroded(s, s, seed, ss, 18 * ss, wander=7 * ss, rag=.5 * ss)
        tm = np.array(Image.fromarray((tm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5 * ss))) / 255.0
        body = fnoise(s, s, 1.8, seed + 3)
        rim = 1 - smoothstep(0.0, .9, np.array(Image.fromarray((tm * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(10 * ss))) / 255.0)
        c = hexc('#cfc5b5')[None, None] + (body[..., None] - .5) * 14
        c = c + (hexc('#b08c69') - c) * (rim[..., None] * .7)
        roll = np.clip(np.array(Image.fromarray((tm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3 * ss))) / 255.0, 0, 1)
        c = c * (.82 + .18 * smoothstep(.3, .9, roll))[..., None]      # the clay edge rolls away, a little darker
        canvas[..., :3] = c; canvas[..., 3] = tm * 255
    else:                   # a slab of wood with a live edge and bark all round
        tm = eroded(s, s, seed, ss, 14 * ss, wander=12 * ss, rag=2.4 * ss, ends=.12, rag_ends=.15, chips=False)
        late, fine, big = grain_field(s, s, seed + 5, 9, .35)
        c = hexc('#c9a87e')[None, None] + (hexc('#94704a') - hexc('#c9a87e')) * (late * .6 + (fine - .5) * .3)[..., None]
        inner = np.array(Image.fromarray((tm * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(17)).filter(ImageFilter.GaussianBlur(3 * ss))) / 255.0
        barkn = fnoise(s, s, 1.0, seed + 6)
        yy2 = np.mgrid[0:s, 0:s][0]; tb = (np.minimum(yy2, s - yy2) < s * .2)
        bark = (1 - inner) * smoothstep(.2, .5, tm + (barkn - .5) * .4) * tb
        c = c * (1 - bark[..., None]) + (hexc('#45321f') + (barkn[..., None] - .5) * 50) * bark[..., None]
        canvas[..., :3] = c; canvas[..., 3] = tm * 255
    pm = eroded(ph, pw, seed + 20, ss, 7 * ss, wander=4 * ss, rag=1.5 * ss, tilt=0)
    oy, ox = (s - ph) // 2 + int(r_off(seed) * ss), (s - pw) // 2 - int(r_off(seed + 1) * ss)
    a = (pm * p[..., 3] / 255.0)[..., None]
    region = canvas[oy:oy + ph, ox:ox + pw]
    region[..., :3] = region[..., :3] * (1 - a) + p[..., :3] * a
    if kind == 'tile':
        pts = mend(s, s, (s * .05, s * .42), -1.15, 55, seed + 30, 2.0 * ss)
        pts = [q for q in pts if not (ox - 4 < q[0] < ox + pw + 4 and oy - 4 < q[1] < oy + ph + 4)]
        paint_mend(canvas, pts, ss)
    rgba(canvas).resize((S, S), Image.LANCZOS).save(path)

def r_off(seed): return (np.random.default_rng(seed).random() - .5) * 14


def edge_mask(path, seed, W=1600, H=48, ss=2, flip=False):
    """The glaze's own edge: where it ends, softly wandering at three scales. A mask only; tileable sideways."""
    w, h = W * ss, H * ss
    line = 24 * ss + n1(w, 1.8, seed) * 16 * ss + n1(w, 1.0, seed + 1) * 2.2 * ss
    yy = np.arange(h)[:, None]; d = yy - line[None, :]
    body = fnoise(h, w, 1.4, seed + 5)
    alpha = smoothstep(-1.2 * ss, .8 * ss, d + (body - .5) * 1.5 * ss)
    a = np.zeros((h, w, 4)); a[..., 3] = alpha * 255
    im = rgba(a).resize((W, H), Image.LANCZOS)
    if flip: im = im.transpose(Image.FLIP_TOP_BOTTOM)
    im.save(path, optimize=True)

def glaze_overlay(path, seed, size=640, dark=.10, light=.06, spec=0.0012):
    """The glaze as a see-through sheet laid over any colour: pools a touch darker, thin places a touch lighter,
    iron specks. Tileable (filtered noise wraps)."""
    pool = fnoise(size, size, 2.0, seed); fine = fnoise(size, size, 1.0, seed + 3)
    v = (pool - .5) * 1.2 + (fine - .5) * .5                     # >0 darker, <0 lighter
    r = np.random.default_rng(seed); s = r.random((size, size)) < spec
    sm = np.array(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
    out = np.zeros((size, size, 4))
    d = np.clip(v, 0, None) * dark + sm * .55; l = np.clip(-v, 0, None) * light
    col = np.where((d >= l)[..., None], hexc('#3a2a1e'), hexc('#ffffff'))
    out[..., :3] = col; out[..., 3] = np.clip(np.maximum(d, l), 0, 1) * 255
    rgba(out).save(path, optimize=True)

def square_crop(src, out, box=(70, 70, 350, 350), size=560):
    im = Image.open(PH + src).convert('RGB').crop(box).resize((size, size), Image.LANCZOS)
    im.save(out, 'WEBP', quality=84)

def to_webp(png, quality=82):
    Image.open(png).convert('RGB').save(png.replace('.png', '.webp'), 'WEBP', quality=quality); os.remove(png)

glaze_overlay(f'{OUT}/ground.png', 3, size=512, dark=.06, light=.04, spec=0.0005)
glaze_overlay(f'{OUT}/glaze.png', 5)
edge_mask(f'{OUT}/edge-top.png', 7)
edge_mask(f'{OUT}/edge-bottom.png', 19, flip=True)
make_stamp(f'{OUT}/stamp.png', 'button', 240, 64, '#8f2a1c', 41, grain=.35)
make_stamp(f'{OUT}/stamp-hover.png', 'button', 240, 64, '#6f1f14', 41, grain=.35)
make_stamp(f'{OUT}/stamp-quiet.png', 'button', 240, 64, '#cdbfa8', 59, grain=.35)
make_stamp(f'{OUT}/stamp-quiet-hover.png', 'button', 240, 64, '#bfae93', 59, grain=.35)
for n in ['kit', 'tip', 'beads']:
    square_crop(f'pointer-{n}.webp', os.path.join(OUT, '..', 'photos', f'pointer-{n}-sq.webp'))
print('wrote', OUT)
