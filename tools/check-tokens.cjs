// Design standard v1 (addendum A): the kit and the page styles use the kit's tokens only. Fails the build when
// site-src/kit/standard.css or the site's page styles (site-src/site.css, else site-src/styles.css) hold a colour
// literal (hex, rgb, hsl, named) or a font size that isn't a --text-* token (colours live in kit/identity.css and
// nowhere else). Print styles are exempt (paper needs plain black and white), as are mask shapes (#000 in a mask
// only means "opaque").
// The same script runs on every site.  Run alone: node tools/check-tokens.cjs
const fs = require('fs');
const path = require('path');

function stripBlocks(css, re) {
  let out = '', i = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(css))) {
    out += css.slice(i, m.index);
    let depth = 0, j = css.indexOf('{', m.index);
    for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}' && --depth === 0) break; }
    i = j + 1; re.lastIndex = i;
  }
  return out + css.slice(i);
}

function check(css, name = 'styles.css', { quiet = false } = {}) {
  let c = css.replace(/\/\*[\s\S]*?\*\//g, '');
  c = stripBlocks(c, /@media print/g);
  c = c.replace(/url\((["']?)data:[^)]*\1\)/g, 'url()').replace(/linear-gradient\(#000 0 0\)/g, '');
  // a colour slot mixed with a little black or white is still that slot, only darker or lighter (the dried edge of
  // the kit's watercolour shapes)
  c = c.replace(/color-mix\(in srgb, var\(--[\w-]+\) \d+%, (?:black|white)\)/g, 'color-mix()');
  const problems = [];
  c.split('\n').forEach((line, n) => {
    const colours = line.match(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(|\b(white|black)\b(?![-\w])/gi);
    if (colours && !/^\s*--/.test(line)) problems.push(`line ${n + 1}: colour literal ${colours.join(', ')}`);
    const sizes = [...line.matchAll(/font-size:\s*([^;}]+)/g)].map(m => m[1].trim()).filter(v => !/^var\(--text-[a-z0-9]+\)$|^(inherit|1em|100%)$/.test(v));
    if (sizes.length) problems.push(`line ${n + 1}: font size ${sizes.join(', ')}`);
  });
  if (problems.length) {
    const msg = `${name}: ${problems.length} value(s) outside the design tokens\n  ` + problems.slice(0, 40).join('\n  ');
    if (process.env.TOKENS_WARN) { if (!quiet) console.warn(msg); } else throw new Error(msg);
  }
  return problems;
}
module.exports = { check };
if (require.main === module) {
  try {
    // the kit and the site's own page styles: site.css where the site has one (Intrinsic Change, whose styles.css is
    // the old stylesheet that leaves page by page), otherwise styles.css. The same files the build checks.
    const own = fs.existsSync(path.join(__dirname, '..', 'site-src', 'site.css')) ? 'site.css' : 'styles.css';
    for (const f of ['kit/standard.css', own]) check(fs.readFileSync(path.join(__dirname, '..', 'site-src', f), 'utf8'), 'site-src/' + f);
    console.log('tokens: ok');
  } catch (e) { console.error(e.message); process.exit(1); }
}
