# Fire & Seed website

The website for Fire & Seed, where Jesse Jonesberg shares the things he makes by hand.
**Version 1 holds one thing: hand-turned Brainspotting pointers.** Beanies, bottles, posters and the other
shelves come later and are not on the site yet.

- Orders are by email only (no shop, no checkout). A contact form may come later.
- Hosted on Netlify. Built by `node tools/build-site.cjs` into `dist/` (no dependencies).
- Preview: `node tools/build-site.cjs && node tools/serve.cjs 5200`, then open http://localhost:5200
- Screenshots (needs Playwright): `node tools/screenshots.cjs` with the preview running.
- Share image and square logo: `node tools/build-images.cjs` after the mark changes.

```
tools/build-site.cjs    every page, the FAQ, schema, sitemap, robots.txt, llms.txt, _redirects
tools/mark.cjs          the flame-and-cone mark and slab words, drawn as SVG (same mark as the beanie patch)
site-src/styles.css     the look: warm greige, silver seam lines, Fraunces + Atkinson Hyperlegible, Alfa Slab One for the mark only
site-src/assets/        photos, fonts (self-hosted), share image
DECISIONS.md            facts, rules and the running log
SEO-NOTES.md            who buys pointers, what they search for, and how the site answers it
```

Facts that change (email, domain, prices, ready-to-ship pointers) live at the top of `tools/build-site.cjs`.
