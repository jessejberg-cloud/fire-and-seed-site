// Renders the share image (og-image.jpg, 1200x630) and the square logo (mark.png, 512) into site-src/assets.
// Run once after the mark changes: node tools/build-images.cjs (needs Playwright's Chromium).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const mark = require('./mark.cjs');
const A = path.resolve(__dirname, '..', 'site-src', 'assets');
const font = f => `url(data:font/woff2;base64,${fs.readFileSync(path.join(A, 'fonts', f)).toString('base64')})`;
const css = `@font-face{font-family:'Alfa Slab One';src:${font('alfa-slab-one-latin-400-normal.woff2')}}
@font-face{font-family:'Fraunces';src:${font('fraunces-latin-500-italic.woff2')};font-style:italic}
body{margin:0;background:#ece7df}`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<style>${css}</style><div style="height:630px;display:grid;place-content:center;justify-items:center;gap:26px">
    <div style="width:620px">${mark.lockup()}</div>
    <div style="font:italic 500 40px Fraunces;color:#5e5850">Hand-turned Brainspotting pointers</div></div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(A, 'og-image.jpg'), type: 'jpeg', quality: 86 });
  await p.setViewportSize({ width: 512, height: 512 });
  await p.setContent(`<style>${css}</style><div style="height:512px;display:grid;place-content:center"><div style="width:360px">${mark.symbol()}</div></div>`);
  await p.screenshot({ path: path.join(A, 'brand', 'mark.png') });
  await b.close();
  console.log('Saved og-image.jpg and brand/mark.png');
})();
