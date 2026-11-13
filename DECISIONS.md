# Fire & Seed website: decisions and log

## Facts
| Item | Value | Status |
| --- | --- | --- |
| Domain | fireandseed.com (GoDaddy) | Confirmed by Jesse 2026-11-02 |
| Second domain | brainspottingpointers.com (on Jesse's old flier) redirects to /brainspotting-pointers/ | To confirm spelling; DNS only with Jesse's OK |
| Not ours | brainspotting-pointers.com (with a hyphen) belongs to another seller | Do not link or redirect |
| Order email | jesse@intrinsicchange.com | Confirmed by Jesse 2026-11-02 |
| Product | Hand-turned wooden Brainspotting pointer kit (was "Heartwood", earlier "Stillpoint") | |
| Prices | Domestic kit $160 (walnut, white walnut, oak or ash); exotic kit $180 (olive). Shipping and tax included | From the Heartwood handoff, Nov 2026 |
| Payment | Venmo or PayPal, by email arrangement. Custom: half deposit, balance before shipping; ships the day after | |
| Size | Telescoping; pocket-sized, smaller than a typical pointer when closed | Jesse, 2026-11-02 |
| Kit | Pointer, labeled leather bag, 3 magnetized recycled glass tips, tip pouch, microfiber cloth, beeswax tin, care card | Old flier and Stillpoint text |
| Tips | 3 large glass; up to 5 small beads; or stones with 5 magnets, glue, instructions; other colors on request; glued by Jesse or self-assembled | |
| Photos | Cropped from Jesse's Heartwood flier (08 Miscellaneous\Pointer Sales). Replace with full-size photos when Jesse has them | Temporary |

## Rules (from Jesse's brief and plan)
- Calm, simple, lots of whitespace. A hub first; selling is a minor add-on. ADHD-friendly: scannable, low clutter.
- Palette: warm greige base; sage or clay sparingly; silver (gintsugi seam) as the one accent. Never gold.
- Mark: block-print sequoia cone in a flame with slab "FIRE & SEED". Replace the drawn SVG with the scanned block print when it exists.
- Voice: first person, warm, spare, plain. Jesse writes the copy. No contractions. No promised outcomes.
- Pages in the brief: Home, Story, Things, Connect. Version 1 uses Home, Brainspotting pointers, Connect. Story waits for Jesse's words.
- No selling to therapy clients; no reviews solicited.

## Log
| Date | Change |
| --- | --- |
| 2026-11-02 | First version built locally: home, /brainspotting-pointers/ (FAQ, Product + Organization + FAQPage + Breadcrumb schema), /connect/, 404, sitemap, robots.txt, llms.txt, redirects. Copy drafted by Claude from Jesse's flier, care card and Stillpoint text; waiting for Jesse's review. Not pushed anywhere. |
| 2026-11-02 | Domain fireandseed.com and order email jesse@intrinsicchange.com confirmed. Added "telescoping" and "pocket-sized" to the pointer page, FAQ, schema and llms.txt. |
| 2026-11-02 | Netlify project fire-and-seed-site linked to this repo by Jesse (main publishes; pull requests get deploy previews behind Netlify team login). No custom domain yet. |
| 2026-11-13 | Redesign started on the shared design kit (branch claude/project-thread-13o15d, not merged, no PR yet to save build credits). Jesse picked **stoneware** after two rounds of sketches (Library: design/fs-redesign/material-options and material-options-2) and ruled that every accent must be **stamped (wood block print) or fire-burned**: generated frames and edge lines looked computer-made. Built: kit/standard.css and standard.js copied unchanged from IC (same as DT); kit/identity.css (clay, pale glaze, iron footer, the mark's red, silver kept for mends; Fraunces + Atkinson Hyperlegible); tools/fs-brushes.cjs (focus strokes, underlines, form marks); tools/fs-glaze.py (glaze and clay as see-through sheets, the glaze's own edge as a mask, a stand-in stamp button, square photo crops); site.css. Old styles.css removed. Every page on kit parts (header strip, bands, row-split, folds, footer on iron glaze). Copy, URLs, titles, meta, schema, llms.txt and redirects unchanged; header button label "Email me" (existing words from Connect). **Waiting on Jesse's stamp and burn photos** for the button, photo frame corners, heading marks and lines between strips; until then no frames or lines are drawn. |
| 2026-11-02 | (missing row) Jesse said "good to publish"; PR #1 squash-merged (1733f56), live. |
