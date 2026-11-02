// Local preview server for the built site (dist/), approximating Netlify:
// pretty URLs (/about -> /about/index.html), 404.html, and the path redirects in dist/_redirects.
// node tools/serve.cjs [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const SITE = path.resolve(__dirname, '..');
const DIST = path.join(SITE, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 5200);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.otf': 'font/otf', '.ttf': 'font/ttf' };

function redirects() {
  try {
    return fs.readFileSync(path.join(DIST, '_redirects'), 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)).filter(r => r[0].startsWith('/'));
  } catch { return []; }
}

function send(res, file, status = 200) {
  fs.readFile(file, (err, data) => {
    if (err) return notFound(res);
    res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}
function notFound(res) {
  const nf = path.join(DIST, '404.html');
  if (fs.existsSync(nf)) return send(res, nf, 404);
  res.writeHead(404); res.end('Not found');
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  for (const [from, to, code] of redirects()) {
    if (from === url || from === url.replace(/\/$/, '') || (from.endsWith('/*') && url.startsWith(from.slice(0, -1)))) {
      res.writeHead(Number((code || '301').replace('!', '')), { Location: to }); return res.end();
    }
  }

  let file = path.join(DIST, url);
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      // Netlify pretty URLs: /team -> 301 /team/
      if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    else if (err && !path.extname(file)) file = path.join(file, 'index.html');
    send(res, file);
  });
}).listen(PORT, () => console.log(`Preview at http://localhost:${PORT}`));
