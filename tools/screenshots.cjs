// Full-page screenshots of every page at 1440 and 390 wide, into screenshots/.
// Start the preview first: node tools/serve.cjs 5200
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '..', 'screenshots');
const PAGES = { home: '/', pointers: '/brainspotting-pointers/', connect: '/connect/', '404': '/nope/' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const w of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    for (const [name, url] of Object.entries(PAGES)) {
      await page.goto('http://localhost:5200' + url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      if (name === 'pointers') await page.evaluate(() => document.querySelectorAll('details').forEach((d, i) => { if (i < 2) d.open = true; }));
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) console.log('HORIZONTAL SCROLL', name, w, sw);
      await page.screenshot({ path: path.join(OUT, `${name}-${w}.png`), fullPage: true });
    }
    await page.close();
  }
  await browser.close();
  console.log('Saved to', OUT);
})();
