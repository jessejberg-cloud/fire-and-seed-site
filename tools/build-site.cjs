// Builds the static Fire & Seed site into ../dist (Netlify publishes dist/).
// node tools/build-site.cjs
// Version 1 holds one thing: hand-turned Brainspotting pointers. Other shelves come later.
const fs = require('fs');
const path = require('path');
const mark = require('./mark.cjs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'site-src');
const DIST = path.join(ROOT, 'dist');

// ---------------------------------------------------------------- facts (change here, nowhere else)
const ORIGIN = 'https://fireandseed.com';            // confirmed by Jesse 2026-11-02
const EMAIL = 'jesse@intrinsicchange.com';             // confirmed by Jesse 2026-11-02
const ORDER_MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Brainspotting pointer')}`;
const MAKER = 'Jesse Jonesberg';
const YEAR = 2026;
const KITS = [
  { name: 'Domestic hardwood kit', price: 160, woods: 'Walnut, white walnut, oak or ash' },
  { name: 'Exotic hardwood kit', price: 180, woods: 'Olive wood' },
];
// Ready-to-ship pointers. Shown only when this list has something in it.
const READY = [];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- the silver seam (gintsugi): a fine, uneven line
function seam(seed, w = 220) {
  let x = 0, d = 'M0,6', s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  while (x < w) { x += 14 + rnd() * 22; d += `L${Math.min(x, w).toFixed(1)},${(3 + rnd() * 6).toFixed(1)}`; }
  return `<svg class="seam" viewBox="0 0 ${w} 12" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
}

// ---------------------------------------------------------------- page shell
const NAV = [['/brainspotting-pointers/', 'Pointers'], ['/connect/', 'Connect']];

function page({ url, title, description, body, schema = [], image = '/assets/og-image.jpg' }) {
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${url === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const ld = schema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${ORIGIN}${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fire &amp; Seed">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${ORIGIN}${url}">
<meta property="og:image" content="${ORIGIN}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ece7df">
<link rel="icon" href="/assets/brand/mark.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/alfa-slab-one-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="/">${mark.line()}</a>
  <nav aria-label="Main">${nav}</nav>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  ${seam(7, 160)}
  <p><a href="/brainspotting-pointers/">Brainspotting pointers</a> · <a href="/connect/">Connect</a></p>
  <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  <p class="small">© ${YEAR} Fire &amp; Seed · Made by hand by ${MAKER}</p>
</footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------- schema
const ORG = {
  '@type': 'Organization', '@id': `${ORIGIN}/#org`, name: 'Fire & Seed', url: `${ORIGIN}/`,
  logo: `${ORIGIN}/assets/brand/mark.png`, email: EMAIL,
  founder: { '@id': `${ORIGIN}/#jesse` },
  description: 'Fire & Seed is where Jesse Jonesberg shares things he makes by hand, starting with hand-turned Brainspotting pointers.',
};
const PERSON = {
  '@type': 'Person', '@id': `${ORIGIN}/#jesse`, name: MAKER,
  jobTitle: 'Therapist, Brainspotting practitioner and woodworker',
  knowsAbout: ['Brainspotting', 'Woodturning'],
  worksFor: { '@id': `${ORIGIN}/#org` },
};
const crumbs = (...items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${ORIGIN}${url}` })),
});

// ---------------------------------------------------------------- the FAQ (also feeds FAQPage schema)
const FAQ = [
  ['What is a Brainspotting pointer?',
    'It is the small wand a Brainspotting practitioner holds up to guide where the client looks. The client follows the tip with their eyes, and the practitioner notices which spots in the visual field stand out. A good pointer is light, steady, easy to see, and quiet in the hand.'],
  ['What makes these different from other pointers?',
    'Each one is hand-turned on a lathe, one at a time, by a therapist who uses Brainspotting in his own practice. The handle is solid hardwood finished with oil and wax, and the tips are recycled glass on magnets so they swap in a second. No two handles have the same grain.'],
  ['Can I choose the wood?',
    'Yes. Walnut, white walnut, oak, ash and olive are the woods I turn most often. If you have another wood in mind, ask me and I will tell you whether I can get it.'],
  ['Can I choose the tips?',
    'Yes. The kit comes with three large interchangeable glass tips, and you pick the colors. You can add up to five small glass beads, or a handful of stones with magnets, glue and instructions. I can glue the tips for you or send them for you to put together.'],
  ['Does it fit in a pocket?',
    'Yes. I made it compact on purpose, so it fits in a pocket or a bag and travels between offices. It comes with a leather storage bag.'],
  ['Can I order one as a gift?',
    'Yes. A pointer can be a gift for a colleague or for someone finishing their Brainspotting training. Tell me who it is for and what they like, and I can help you choose.'],
  ['How do I order?',
    `Email me at ${EMAIL}. Tell me the wood and the tip colors you like, or tell me what you are not sure about. We talk it through until the plan feels right to you.`],
  ['How do I pay?',
    'By Venmo or PayPal. For a custom order, half is paid as a deposit before I start, and the balance is paid when your pointer is finished. It ships the day after the balance is paid.'],
  ['Are shipping and tax included?',
    'Yes. The price you see is the price you pay.'],
  ['How long does a custom pointer take?',
    'It depends on the wood and on what else is on the lathe. I will give you an honest time frame when we talk.'],
  ['What if I am not happy with it?',
    'Tell me. I work with each person until they are happy with their pointer.'],
  ['How do I care for the wood?',
    'Keep it dry, and do not leave it in a hot car or in direct sun. Store it in its leather bag. If the wood looks dry, rub in a little of the beeswax from the kit with a soft cloth. Over time the wood deepens in color.'],
];

// ---------------------------------------------------------------- pages
const pages = {};

pages['/'] = page({
  url: '/',
  title: 'Fire & Seed | Hand-turned Brainspotting pointers by Jesse Jonesberg',
  description: 'Fire & Seed is where Jesse Jonesberg, a therapist and Brainspotting practitioner, shares the things he makes by hand. Right now that is custom, hand-turned wooden Brainspotting pointers.',
  schema: [{ '@context': 'https://schema.org', '@graph': [ORG, PERSON, {
    '@type': 'WebSite', '@id': `${ORIGIN}/#site`, url: `${ORIGIN}/`, name: 'Fire & Seed', publisher: { '@id': `${ORIGIN}/#org` },
  }] }],
  body: `
<section class="hero">
  <h1 class="visually-hidden">Fire &amp; Seed</h1>
  <div class="hero-mark">${mark.lockup({ id: 'hero', title: 'Fire and Seed: a red flame behind a brown sequoia cone, beside the words FIRE and SEED' })}</div>
  <p class="motto">Some seeds only open in fire.</p>
</section>

<section class="band reveal">
  ${seam(3)}
  <h2>What this place is</h2>
  <p>I am Jesse. I am a therapist, and I turn wood. Fire &amp; Seed is where I share the things I make by hand.</p>
</section>

<section class="band reveal">
  ${seam(11)}
  <h2>Made here now</h2>
  <a class="shelf" href="/brainspotting-pointers/">
    <img src="/assets/photos/pointer-kit.webp" width="420" height="420" alt="An olive wood Brainspotting pointer with its leather bag, glass tips, cloth and beeswax tin">
    <span class="shelf-text">
      <span class="shelf-title">Brainspotting pointers</span>
      <span>Hand-turned from hardwood, with glass tips you choose. Made to order.</span>
      <span class="more">See the pointers</span>
    </span>
  </a>
</section>
`,
});

const kitRows = KITS.map(k => `<li><span class="kit-name">${k.name}</span><span class="kit-woods">${k.woods}</span><span class="kit-price">$${k.price}</span></li>`).join('');
const ready = READY.length ? `
<section class="band" id="ready">
  ${seam(29)}
  <h2>Ready to ship</h2>
  <ul class="plain">${READY.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
</section>` : '';

pages['/brainspotting-pointers/'] = page({
  url: '/brainspotting-pointers/',
  title: 'Handmade Wooden Brainspotting Pointers | Fire & Seed',
  description: 'Custom wooden Brainspotting pointers, hand-turned one at a time by a therapist and Brainspotting practitioner. Choose your wood, glass tips or stone toppers. From $160, shipping included.',
  schema: [
    { '@context': 'https://schema.org', '@graph': [ORG, PERSON, {
      '@type': 'Product', '@id': `${ORIGIN}/brainspotting-pointers/#pointer`,
      name: 'Hand-turned Brainspotting pointer kit',
      description: 'A custom Brainspotting pointer hand-turned from solid hardwood, with interchangeable magnetized recycled glass tips, a leather storage bag, a tip pouch, a microfiber cloth, a beeswax tin and a care card. Choice of wood and tip colors.',
      image: ['tip', 'beads', 'kit'].map(n => `${ORIGIN}/assets/photos/pointer-${n}.webp`),
      brand: { '@type': 'Brand', name: 'Fire & Seed' },
      manufacturer: { '@id': `${ORIGIN}/#jesse` },
      material: 'Hardwood (walnut, white walnut, oak, ash or olive), recycled glass, steel',
      category: 'Brainspotting pointer',
      offers: {
        '@type': 'AggregateOffer', priceCurrency: 'USD',
        lowPrice: Math.min(...KITS.map(k => k.price)), highPrice: Math.max(...KITS.map(k => k.price)), offerCount: KITS.length,
        availability: 'https://schema.org/MadeToOrder',
        seller: { '@id': `${ORIGIN}/#org` },
        url: `${ORIGIN}/brainspotting-pointers/`,
      },
    }] },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    crumbs(['Home', '/'], ['Brainspotting pointers', '/brainspotting-pointers/']),
  ],
  body: `
<article class="product">
<header class="product-head">
  <p class="eyebrow">Made to order</p>
  <h1>Handmade wooden Brainspotting pointers</h1>
  <p class="lede">As a Brainspotting practitioner and woodworker, I wanted a pointer made from natural materials that is comfortable, portable and easy to change. So I made one.</p>
  <p>I turn each pointer by hand from solid hardwood, sized to sit steady in the hand and fit in a pocket. You choose the wood and the glass tips, and I work with you until you are happy with it. It is made to wear in, not wear out.</p>
  <p><a class="button" href="${ORDER_MAILTO}">Email me about a pointer</a></p>
</header>

<div class="photos">
  <img src="/assets/photos/pointer-tip.webp" width="420" height="420" alt="A blue recycled glass tip on the end of a Brainspotting pointer">
  <img src="/assets/photos/pointer-beads.webp" width="420" height="420" alt="A dark red hardwood pointer resting on a log, with glass beads in many colors around it">
  <img src="/assets/photos/pointer-kit.webp" width="420" height="420" alt="An olive wood pointer kit: leather bag, cloth, glass tips in a pouch and a beeswax tin">
</div>

<section class="band">
  ${seam(5)}
  <h2>Choose your wood</h2>
  <ul class="kits">${kitRows}</ul>
  <p class="note">Shipping and tax are included. Have another wood in mind? Ask me.</p>
</section>

<section class="band">
  ${seam(13)}
  <h2>Choose your tips and toppers</h2>
  <ul class="plain">
    <li>Three large glass tips, in the colors you pick</li>
    <li>Up to five small glass beads, if you want them</li>
    <li>Or a handful of stones, with magnets, glue and instructions</li>
    <li>Other colors on request</li>
  </ul>
  <p class="note">The tips are recycled glass on magnets, so they swap in a second. I can glue them for you, or you can put them together yourself.</p>
</section>

<section class="band">
  ${seam(17)}
  <h2>What comes in the kit</h2>
  <ul class="plain">
    <li>Your hand-turned wooden pointer</li>
    <li>A labeled leather storage bag</li>
    <li>Three interchangeable magnetized glass tips</li>
    <li>A tip pouch</li>
    <li>A microfiber cloth</li>
    <li>A tin of beeswax for the wood</li>
    <li>A care card</li>
  </ul>
</section>
${ready}
<section class="band">
  ${seam(19)}
  <h2>How an order works</h2>
  <ol class="steps">
    <li><b>Email me.</b> Tell me the wood and colors you like, or what you are unsure about.</li>
    <li><b>We settle the details.</b> We talk it through until the plan feels right to you.</li>
    <li><b>I turn your pointer.</b> Half is paid as a deposit before I start.</li>
    <li><b>It ships.</b> You pay the balance by Venmo or PayPal, and it ships the next day.</li>
  </ol>
</section>

<section class="band maker">
  ${seam(23)}
  <h2>Who makes them</h2>
  <div class="maker-row">
    <img src="/assets/photos/jesse.webp" width="450" height="345" alt="Jesse Jonesberg, smiling">
    <p>I am ${MAKER}, a therapist and Brainspotting practitioner. I use a pointer in my own sessions, and I wanted one that felt grounded and personal. Every pointer here comes off my own lathe.</p>
  </div>
</section>

<section class="band" id="faq">
  ${seam(31)}
  <h2>Questions</h2>
  ${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}
</section>

<section class="band end">
  <p><a class="button" href="${ORDER_MAILTO}">Email me about a pointer</a></p>
  <p class="note"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
</section>
</article>
`,
});

pages['/connect/'] = page({
  url: '/connect/',
  title: 'Connect | Fire & Seed',
  description: 'Email Jesse Jonesberg at Fire & Seed about a custom hand-turned Brainspotting pointer.',
  schema: [crumbs(['Home', '/'], ['Connect', '/connect/'])],
  body: `
<section class="band first">
  <h1>Connect</h1>
  <p>Orders and questions come to my email for now. I read every one.</p>
  <p><a class="button" href="${ORDER_MAILTO}">Email me</a></p>
  <p class="note"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
</section>
`,
});

const notFound = page({
  url: '/404.html',
  title: 'Page not found | Fire & Seed',
  description: 'This page is not here.',
  body: `
<section class="band first">
  <h1>This page is not here</h1>
  <p><a href="/brainspotting-pointers/">See the Brainspotting pointers</a> or go <a href="/">home</a>.</p>
</section>
`,
});

// ---------------------------------------------------------------- AI search: plain summary at /llms.txt
const llms = `# Fire & Seed

> Fire & Seed (${ORIGIN}) is where ${MAKER}, a therapist and Brainspotting practitioner, sells custom, hand-turned wooden Brainspotting pointers. Orders are by email: ${EMAIL}.

## Brainspotting pointers
- Hand-turned one at a time on a lathe from solid hardwood by ${MAKER}.
- Woods: walnut, white walnut, oak, ash (domestic kit, $${KITS[0].price}); olive (exotic kit, $${KITS[1].price}). Other woods on request.
- Tips: interchangeable magnetized recycled glass tips in the buyer's chosen colors; small beads or stones on request.
- Kit: pointer, labeled leather storage bag, three glass tips, tip pouch, microfiber cloth, beeswax tin, care card.
- Compact; fits in a pocket.
- Shipping and tax included in the price. Pay by Venmo or PayPal; custom orders take half as a deposit.
- Jesse works with each buyer until they are happy with their pointer.

## Pages
- [Brainspotting pointers](${ORIGIN}/brainspotting-pointers/): the pointer, options, prices and questions
- [Connect](${ORIGIN}/connect/): how to order
`;

// ---------------------------------------------------------------- write
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(SRC, DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'assets', 'brand'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'assets', 'brand', 'mark.svg'), mark.symbol());
for (const [url, html] of Object.entries(pages)) {
  const dir = path.join(DIST, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
fs.writeFileSync(path.join(DIST, '404.html'), notFound);
fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(pages).map(u => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}
</urlset>
`);
// Old addresses people may still have. brainspottingpointers.com is on Jesse's old flier.
fs.writeFileSync(path.join(DIST, '_redirects'), `# Netlify redirects
/pointers                      /brainspotting-pointers/  301
/brainspotting-pointer         /brainspotting-pointers/  301
/shop                          /brainspotting-pointers/  301
https://brainspottingpointers.com/*     ${ORIGIN}/brainspotting-pointers/  301!
https://www.brainspottingpointers.com/* ${ORIGIN}/brainspotting-pointers/  301!
https://www.fireandseed.com/*           ${ORIGIN}/:splat  301!
`);
console.log('Built', Object.keys(pages).length + 1, 'pages into dist/');
